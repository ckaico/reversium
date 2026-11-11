#!/usr/bin/env node
// Reversium MCP server. Local-first. Stdio transport.
// Tools: target.classify · blueprint.create/get/update/diff/list · loop.compare · rea.handoff ·
//        own_site.challenge/verify/headers · teardown.render · verdict.save/list
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  ACCESS, DOMAINS, SECTIONS, now, slugify, readMeta, writeMeta, writeVersion, readVersion, listBlueprints,
  countRounds, writeLoopRound, type Meta, type Sections, type Attestation,
} from "./store.js";
import { classify } from "./classify.js";
import { checkAttestation, refusalText } from "./aup.js";
import { compareSections, pickNextChange, renderRound } from "./loop.js";
import { diffSections, renderDiff } from "./diff.js";
import { writeReaTask } from "./rea.js";
import { challenge, verify, headersRead, isVerified } from "./ownsite.js";
import { renderTeardown } from "./render.js";
import { SCORE_KEYS, SCORE_HELP, problems, saveVerdict, listVerdicts, type VerdictInput } from "./verdict.js";

const server = new McpServer({ name: "reversium", version: "0.1.0" });

const text = (s: string) => ({ content: [{ type: "text" as const, text: s }] });
const json = (o: unknown) => text(JSON.stringify(o, null, 2));

const AttestationSchema = z.object({
  access: z.enum(ACCESS).describe("owned | licensed | public | unknown"),
  statement: z.string().describe("The user's own words: how they lawfully have this target."),
  noCircumvention: z.boolean().describe("True if no access control, licence check or DRM will be worked around."),
  noSafetySystems: z.boolean().describe("True if no safety or flight-restriction system will be changed."),
  noPrivateData: z.boolean().describe("True if nothing comes from behind a login, a leak or an NDA."),
});

const SectionsSchema = z.record(z.string(), z.string()).describe(`Blueprint sections. Standard keys: ${SECTIONS.join(", ")}. Extra keys allowed (e.g. TRAFFIC, CUTS, REACH, PARTS).`);

server.tool(
  "target_classify",
  "Classify a target (path, URL or phrase): domain, which skill handles it, whether REA should do the software work. Does not judge lawfulness; that is the attestation's job.",
  { input: z.string() },
  async ({ input }) => json(classify(input)),
);

server.tool(
  "blueprint_create",
  "Create blueprint v1 for a target. Refuses without a complete lawful-access attestation and names the AUP clause.",
  { target: z.string(), domain: z.enum(DOMAINS), attestation: AttestationSchema, sections: SectionsSchema, slug: z.string().optional() },
  async ({ target, domain, attestation, sections, slug }) => {
    const aup = checkAttestation(attestation as Attestation, domain, domain === "own-site" ? isVerified(target) : false);
    if (!aup.ok) return text(refusalText(aup));
    const s = slug ? slugify(slug) : slugify(target);
    if (await readMeta(s)) return text(`A blueprint named "${s}" already exists. Use blueprint_update to add a version, or pass a different slug.`);
    const meta: Meta = { slug: s, target, domain, attestation: attestation as Attestation, created: now(), updated: now(), versions: 1, notes: [{ version: 1, at: now(), note: "created" }] };
    const withRules: Sections = { ...sections, RULES: sections.RULES ?? `Access: ${attestation.statement.replace(/\.$/, "")}. Nothing circumvented. Nothing from behind a login. Nothing of the target's redistributed.` };
    await writeMeta(meta);
    const md = await writeVersion(meta, 1, withRules);
    return text(`Saved .reversium/blueprints/${s}/v001.md\n\n${md}`);
  },
);

server.tool(
  "blueprint_get",
  "Read a blueprint (latest version by default).",
  { slug: z.string(), version: z.number().int().positive().optional() },
  async ({ slug, version }) => {
    const meta = await readMeta(slugify(slug));
    if (!meta) return text(`No blueprint "${slug}".`);
    const v = version ?? meta.versions;
    const r = await readVersion(meta.slug, v);
    if (!r) return text(`No version ${v} for "${meta.slug}". Latest is ${meta.versions}.`);
    return text(r.md);
  },
);

server.tool(
  "blueprint_update",
  "Add a new version: merge section edits into the latest version and record a note on what changed and why.",
  { slug: z.string(), sections: SectionsSchema, note: z.string() },
  async ({ slug, sections, note }) => {
    const meta = await readMeta(slugify(slug));
    if (!meta) return text(`No blueprint "${slug}".`);
    const latest = await readVersion(meta.slug, meta.versions);
    const merged: Sections = { ...(latest?.sections ?? {}), ...sections };
    const v = meta.versions + 1;
    meta.versions = v; meta.updated = now(); meta.notes.push({ version: v, at: now(), note });
    await writeMeta(meta);
    const md = await writeVersion(meta, v, merged);
    return text(`Saved v${String(v).padStart(3, "0")} (${note})\n\n${md}`);
  },
);

server.tool(
  "blueprint_diff",
  "What changed between two versions, section by section.",
  { slug: z.string(), from: z.number().int().positive(), to: z.number().int().positive().optional() },
  async ({ slug, from, to }) => {
    const meta = await readMeta(slugify(slug));
    if (!meta) return text(`No blueprint "${slug}".`);
    const b = to ?? meta.versions;
    const A = await readVersion(meta.slug, from), B = await readVersion(meta.slug, b);
    if (!A || !B) return text(`Missing a version. Latest is ${meta.versions}.`);
    return text(renderDiff(meta.slug, from, b, diffSections(A.sections, B.sections)));
  },
);

server.tool("blueprint_list", "List blueprints in this project.", {}, async () => {
  const all = await listBlueprints();
  if (!all.length) return text("No blueprints yet. Start with target_classify, then blueprint_create.");
  return text(all.map((m) => `${m.slug} · ${m.domain} · v${m.versions} · ${m.updated.slice(0, 10)} · ${m.target}`).join("\n"));
});

server.tool(
  "loop_compare",
  "One round of the loop: your attempt against the blueprint, section by section, and exactly one recommended change. Saves the round.",
  { slug: z.string(), attempt: SectionsSchema.describe("Your build so far, in the same section keys."), attemptNote: z.string().describe("What you built this round, in a sentence or two.") },
  async ({ slug, attempt, attemptNote }) => {
    const meta = await readMeta(slugify(slug));
    if (!meta) return text(`No blueprint "${slug}".`);
    const ref = await readVersion(meta.slug, meta.versions);
    if (!ref) return text("Blueprint has no versions.");
    const gaps = compareSections(ref.sections, attempt);
    const next = pickNextChange(gaps);
    const round = (await countRounds(meta.slug)) + 1;
    const md = renderRound(meta.slug, round, meta.versions, gaps, attemptNote, next);
    const p = await writeLoopRound(meta.slug, round, md);
    return text(`Saved ${p}\n\n${md}`);
  },
);

server.tool(
  "rea_handoff",
  "For software targets: write a REA task file (REA does unpacking, protocol and binary work; Reversium keeps the blueprint).",
  { target: z.string(), attestation: AttestationSchema },
  async ({ target, attestation }) => {
    const aup = checkAttestation(attestation as Attestation, "software");
    if (!aup.ok) return text(refusalText(aup));
    return json(await writeReaTask(target, attestation.statement));
  },
);

server.tool("own_site_challenge", "Start ownership verification for a domain you control. Returns a token to place in DNS or at /.well-known/reversium.txt.", { domain: z.string() }, async ({ domain }) => json(await challenge(domain)));
server.tool("own_site_verify", "Check the ownership token. Must pass before any security read.", { domain: z.string() }, async ({ domain }) => json(await verify(domain)));
server.tool("own_site_headers", "Read-only security headers check of a verified domain's homepage. One request. Nothing else is touched.", { domain: z.string() }, async ({ domain }) => json(await headersRead(domain)));

server.tool(
  "teardown_render",
  "Render a blueprint as a public teardown page (./teardown/<slug>/index.html) using the site template.",
  { slug: z.string(), version: z.number().int().positive().optional(), video: z.string().optional(), submitter: z.string().optional() },
  async ({ slug, version, video, submitter }) => {
    const meta = await readMeta(slugify(slug));
    if (!meta) return text(`No blueprint "${slug}".`);
    const v = version ?? meta.versions;
    const r = await readVersion(meta.slug, v);
    if (!r) return text(`No version ${v}.`);
    const out = await renderTeardown(meta, v, r.sections, { video, submitter });
    return text(`Rendered ${out}`);
  },
);

const ScoreSchema = z.object({ score: z.number().int().min(0).max(5), why: z.string() });

server.tool(
  "verdict_save",
  `Is it bullshit? Save a dated verdict on a public tool, repo or product. You do the research; the server checks it and computes the verdict. Scores 0–5, each with a reason: ${SCORE_KEYS.map((k) => `${k}: ${SCORE_HELP[k]}`).join(" ")} Rejects missing reasons, fewer than 2 sourced URLs, or an edge of 2 or lower with nothing named as better.`,
  {
    target: z.string().describe("Name and link, e.g. 'ponytail · https://github.com/…'"),
    claim: z.string().describe("What it says it does, in its own framing."),
    inside: z.string().describe("What it actually is: model, method, data, how much is original."),
    scores: z.object(Object.fromEntries(SCORE_KEYS.map((k) => [k, ScoreSchema])) as Record<(typeof SCORE_KEYS)[number], typeof ScoreSchema>),
    better: z.array(z.object({ name: z.string(), url: z.string(), why: z.string() })).describe("Stronger alternatives available now. Empty only if nothing beats it."),
    rebuildPlan: z.string().describe("How to build an equal or better version today, with which public parts, and how long."),
    sources: z.array(z.object({ url: z.string(), what: z.string() })).describe("Every URL you relied on and what it showed."),
    slug: z.string().optional(),
  },
  async (input) => {
    const p = problems(input as VerdictInput);
    if (p.length) return text(`Not saved. Fix these first:\n${p.map((x) => `- ${x}`).join("\n")}`);
    const r = await saveVerdict(input as VerdictInput);
    return text(`Saved ${r.path}\n\n${r.md}`);
  },
);

server.tool("verdict_list", "List saved verdicts in this project, newest first.", {}, async () => {
  const all = await listVerdicts();
  if (!all.length) return text("No verdicts yet. Run /bullshit <repo, link or name>.");
  return text(all.map((v) => `${v.slug} · ${v.label} · ${v.total}/30 · v${v.version} · ${v.checked.slice(0, 10)} · ${v.target}`).join("\n"));
});

const transport = new StdioServerTransport();
await server.connect(transport);
