// "Is it bullshit?" Verdicts on public tools, repos and products.
// The agent does the research; this module holds the rules: every score needs a reason,
// claims need sources, and if something is better it has to be named. The verdict is computed, not typed.
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { root, slugify, now } from "./store.js";

export const SCORE_KEYS = ["novelty", "edge", "moat", "substance", "freshness", "rebuild"] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];

export const SCORE_HELP: Record<ScoreKey, string> = {
  novelty: "Is the core idea new? 0 = it already existed before this, 5 = first of its kind.",
  edge: "How it compares to the best alternative available today. 0 = clearly worse, 3 = level, 5 = clearly ahead.",
  moat: "What it has that isn't public: own data, trained weights, hardware, users. 0 = nothing, 5 = hard to get.",
  substance: "Evidence vs. branding: code that runs, benchmarks, reproducible results. 0 = claims only, 5 = proven.",
  freshness: "Age of the model, data or method vs. the current state of the art. 0 = superseded, 5 = current.",
  rebuild: "Effort to build an equal or better version today from public parts. 0 = an afternoon, 5 = not realistic.",
};

export interface Score { score: number; why: string }
export interface Alternative { name: string; url: string; why: string }
export interface Source { url: string; what: string }

export interface VerdictInput {
  target: string;
  claim: string;        // what it says it does, in its own framing
  inside: string;       // what it actually is under the hood
  scores: Record<ScoreKey, Score>;
  better: Alternative[];
  rebuildPlan: string;  // how you'd build the equal-or-better version, with what
  sources: Source[];
  slug?: string;
}

export interface Verdict { label: string; total: number; line: string; flags: string[] }

export const LABELS = {
  real: "Real deal",
  good: "Good, not special",
  branding: "Mostly branding",
  bs: "Bullshit",
} as const;

export function problems(v: VerdictInput): string[] {
  const out: string[] = [];
  for (const k of SCORE_KEYS) {
    const s = v.scores[k];
    if (!s) { out.push(`Missing score: ${k}. ${SCORE_HELP[k]}`); continue; }
    if (!Number.isInteger(s.score) || s.score < 0 || s.score > 5) out.push(`${k} must be a whole number 0–5.`);
    if (!s.why || s.why.trim().length < 12) out.push(`${k} needs a reason, not just a number.`);
  }
  const urls = (v.sources ?? []).filter((s) => /^https?:\/\//i.test(s.url));
  if (urls.length < 2) out.push("Needs at least 2 sources with URLs (the target itself plus one independent check).");
  const edge = v.scores.edge?.score;
  if (typeof edge === "number" && edge <= 2 && !(v.better ?? []).length) out.push("Edge is 2 or lower, so name what is better in `better` (name, URL, why).");
  for (const b of v.better ?? []) if (!/^https?:\/\//i.test(b.url)) out.push(`Alternative "${b.name}" needs a URL.`);
  if (!v.claim?.trim()) out.push("`claim` is empty: say what it claims, in its own framing.");
  if (!v.inside?.trim()) out.push("`inside` is empty: say what it actually is.");
  return out;
}

export function judge(scores: Record<ScoreKey, Score>): Verdict {
  const n = (k: ScoreKey) => scores[k].score;
  const total = SCORE_KEYS.reduce((a, k) => a + n(k), 0);
  const flags: string[] = [];
  // "Bullshit" is reserved for claims without evidence. Real work that is behind is "Mostly branding".
  let label: string = total >= 24 ? LABELS.real : total >= 17 ? LABELS.good : LABELS.branding;
  if (n("substance") <= 1) { label = LABELS.bs; flags.push("Claims without evidence."); }
  else if (n("novelty") <= 1 && n("edge") <= 1) { label = LABELS.branding; flags.push("Already exists, and something else does it better."); }
  if (n("rebuild") <= 1) flags.push("You could build this yourself with public parts.");
  if (n("freshness") <= 1) flags.push("Built on superseded tech.");
  if (n("moat") >= 4) flags.push("Has something you can't easily get.");
  const line = {
    [LABELS.real]: "New, ahead of the alternatives, and backed by evidence.",
    [LABELS.good]: "Solid work, but not as far ahead as it looks.",
    [LABELS.branding]: "The packaging is doing more of the work than the tech.",
    [LABELS.bs]: "The claims outrun the evidence.",
  }[label]!;
  return { label, total, line, flags };
}

export function renderVerdict(v: VerdictInput, j: Verdict, at: string, version: number) {
  const sc = SCORE_KEYS.map((k) => `| ${k} | ${v.scores[k].score}/5 | ${v.scores[k].why.replace(/\|/g, "/").replace(/\n/g, " ")} |`).join("\n");
  const better = v.better.length ? v.better.map((b) => `- **${b.name}** · ${b.url} · ${b.why}`).join("\n") : "- Nothing found that beats it.";
  const sources = v.sources.map((s) => `- ${s.url} · ${s.what}`).join("\n");
  return (
    `# Is it bullshit? · ${v.target}\n\n` +
    `checked: ${new Date(at).toLocaleDateString("en-CA")} · version: ${version}\n\n` +
    `## VERDICT\n**${j.label}** · ${j.total}/30 · ${j.line}\n${j.flags.map((f) => `- ${f}`).join("\n")}\n\n` +
    `## CLAIM\n${v.claim.trim()}\n\n` +
    `## INSIDE\n${v.inside.trim()}\n\n` +
    `## SCORES\n| score | | why |\n|---|---|---|\n${sc}\n\n` +
    `## BETTER\n${better}\n\n` +
    `## REBUILD\n${v.rebuildPlan.trim()}\n\n` +
    `## SOURCES\n${sources}\n\n` +
    `## RULES\nPublic information only. Scores are a dated judgement, not a fact; re-check when the field moves.\n`
  );
}

const vDir = (slug: string, cwd?: string) => join(root(cwd), "verdicts", slug);

export async function saveVerdict(v: VerdictInput, cwd?: string) {
  const slug = slugify(v.slug ?? v.target);
  const dir = vDir(slug, cwd);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const version = (await readdir(dir)).filter((f) => /^v\d+\.md$/.test(f)).length + 1;
  const at = now();
  const j = judge(v.scores);
  const md = renderVerdict(v, j, at, version);
  const base = join(dir, `v${String(version).padStart(3, "0")}`);
  await writeFile(`${base}.md`, md);
  await writeFile(`${base}.json`, JSON.stringify({ ...v, slug, checked: at, verdict: j }, null, 2));
  return { slug, version, path: `.reversium/verdicts/${slug}/v${String(version).padStart(3, "0")}.md`, verdict: j, md };
}

export async function listVerdicts(cwd?: string) {
  const dir = join(root(cwd), "verdicts");
  if (!existsSync(dir)) return [];
  const out: { slug: string; target: string; label: string; total: number; checked: string; version: number }[] = [];
  for (const slug of await readdir(dir)) {
    const files = existsSync(join(dir, slug)) ? (await readdir(join(dir, slug))).filter((f) => /^v\d+\.json$/.test(f)).sort() : [];
    if (!files.length) continue;
    const last = JSON.parse(await readFile(join(dir, slug, files[files.length - 1]), "utf8"));
    out.push({ slug, target: last.target, label: last.verdict.label, total: last.verdict.total, checked: last.checked, version: files.length });
  }
  return out.sort((a, b) => b.checked.localeCompare(a.checked));
}
