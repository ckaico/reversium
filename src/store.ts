// Local-first storage. Everything lives under ./.reversium in the working directory.
// Blueprints are markdown (for people) with a JSON sidecar (for tools). Nothing leaves the machine.
import { mkdir, readFile, writeFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

export const SECTIONS = ["TARGET", "INSIDE", "FOUND", "PLAN", "LOOP", "RULES"] as const;
export type Section = (typeof SECTIONS)[number];
export type Sections = Record<string, string | undefined>;

export const DOMAINS = ["software", "device", "film-ad", "edit-style", "viral-format", "company", "own-site"] as const;
export type Domain = (typeof DOMAINS)[number];

export const ACCESS = ["owned", "licensed", "public", "unknown"] as const;
export type Access = (typeof ACCESS)[number];

export interface Attestation {
  access: Access;
  statement: string;        // the user's own words: how they lawfully have this target
  noCircumvention: boolean; // no access controls, licence checks or DRM will be worked around
  noSafetySystems: boolean; // no safety or flight-restriction systems will be changed
  noPrivateData: boolean;   // nothing from behind a login, nothing leaked or under NDA
}

export interface Meta {
  slug: string;
  target: string;
  domain: Domain;
  attestation: Attestation;
  created: string;
  updated: string;
  versions: number;
  notes: { version: number; at: string; note: string }[];
}

export const now = () => new Date().toISOString();

export function root(cwd = process.cwd()) {
  return join(cwd, ".reversium");
}

export function slugify(s: string) {
  const out = s.toLowerCase().replace(/https?:\/\//, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  return out || "target";
}

async function ensure(dir: string) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

export const bpDir = (slug: string, cwd?: string) => join(root(cwd), "blueprints", slug);
export const loopDir = (slug: string, cwd?: string) => join(root(cwd), "loop", slug);
export const versionFile = (slug: string, v: number, cwd?: string) => join(bpDir(slug, cwd), `v${String(v).padStart(3, "0")}.md`);

export function renderMarkdown(meta: Meta, version: number, sections: Sections) {
  const extra = Object.keys(sections).filter((k) => !(SECTIONS as readonly string[]).includes(k));
  const order = [...SECTIONS, ...extra];
  const body = order.filter((k) => sections[k]).map((k) => `## ${k}\n${sections[k]!.trim()}\n`).join("\n");
  const a = meta.attestation;
  return (
    `# Blueprint · ${meta.target}\n\n` +
    `slug: ${meta.slug} · version: ${version} · domain: ${meta.domain} · access: ${a.access}\n` +
    `lawful access: ${a.statement}\n\n` +
    body
  );
}

export function parseMarkdown(md: string): Sections {
  const out: Sections = {};
  const re = /^## ([A-Z][A-Z0-9 \/-]*)\n([\s\S]*?)(?=^## |\s*$)/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) out[m[1].trim()] = m[2].trim();
  return out;
}

export async function readMeta(slug: string, cwd?: string): Promise<Meta | null> {
  const p = join(bpDir(slug, cwd), "meta.json");
  if (!existsSync(p)) return null;
  return JSON.parse(await readFile(p, "utf8"));
}

export async function writeMeta(meta: Meta, cwd?: string) {
  await ensure(bpDir(meta.slug, cwd));
  await writeFile(join(bpDir(meta.slug, cwd), "meta.json"), JSON.stringify(meta, null, 2));
}

export async function writeVersion(meta: Meta, v: number, sections: Sections, cwd?: string) {
  await ensure(bpDir(meta.slug, cwd));
  const md = renderMarkdown(meta, v, sections);
  await writeFile(versionFile(meta.slug, v, cwd), md);
  await writeFile(versionFile(meta.slug, v, cwd).replace(/\.md$/, ".json"), JSON.stringify(sections, null, 2));
  return md;
}

export async function readVersion(slug: string, v: number, cwd?: string): Promise<{ md: string; sections: Sections } | null> {
  const p = versionFile(slug, v, cwd);
  if (!existsSync(p)) return null;
  const md = await readFile(p, "utf8");
  const j = p.replace(/\.md$/, ".json");
  const sections: Sections = existsSync(j) ? JSON.parse(await readFile(j, "utf8")) : parseMarkdown(md);
  return { md, sections };
}

export async function listBlueprints(cwd?: string): Promise<Meta[]> {
  const dir = join(root(cwd), "blueprints");
  if (!existsSync(dir)) return [];
  const out: Meta[] = [];
  for (const n of await readdir(dir)) {
    if (!(await stat(join(dir, n))).isDirectory()) continue;
    const m = await readMeta(n, cwd);
    if (m) out.push(m);
  }
  return out.sort((a, b) => b.updated.localeCompare(a.updated));
}

export async function countRounds(slug: string, cwd?: string) {
  const dir = loopDir(slug, cwd);
  if (!existsSync(dir)) return 0;
  return (await readdir(dir)).filter((f) => f.startsWith("round-")).length;
}

export async function writeLoopRound(slug: string, round: number, md: string, cwd?: string) {
  await ensure(loopDir(slug, cwd));
  const p = join(loopDir(slug, cwd), `round-${String(round).padStart(2, "0")}.md`);
  await writeFile(p, md);
  return p;
}

export async function writeText(rel: string, text: string, cwd?: string) {
  const p = join(root(cwd), rel);
  await ensure(dirname(p));
  await writeFile(p, text);
  return p;
}
