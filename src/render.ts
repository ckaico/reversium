// Render a blueprint as a public teardown page using the site template.
// Output goes to ./teardown/<slug>/index.html next to .reversium, ready to copy into the website repo.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Meta, Sections } from "./store.js";
import { SECTIONS } from "./store.js";

const here = dirname(fileURLToPath(import.meta.url));

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function renderTeardown(meta: Meta, version: number, sections: Sections, opts: { video?: string; submitter?: string; cwd?: string } = {}) {
  const tplPath = [join(here, "../site/teardown-template.html"), join(here, "../../site/teardown-template.html")].find(existsSync);
  if (!tplPath) throw new Error("teardown-template.html not found");
  let html = await readFile(tplPath, "utf8");
  const extra = Object.keys(sections).filter((k) => !(SECTIONS as readonly string[]).includes(k));
  const order = [...SECTIONS, ...extra].filter((k) => sections[k]);
  const body = order.map((k) => `<section class="s"><h2>${esc(k)}</h2><p>${esc(sections[k]!.trim()).replace(/\n/g, "<br>")}</p></section>`).join("\n");
  const rep: Record<string, string> = {
    "{{TITLE}}": esc(meta.target),
    "{{SLUG}}": esc(meta.slug),
    "{{DOMAIN}}": esc(meta.domain),
    "{{DATE}}": meta.updated.slice(0, 10),
    "{{VERSION}}": String(version),
    "{{ACCESS}}": esc(meta.attestation.statement),
    "{{SUBMITTER}}": esc(opts.submitter ?? "an early-access member"),
    "{{VIDEO}}": opts.video ? `<p class="video"><a href="${esc(opts.video)}" rel="noopener">Watch the teardown</a></p>` : "",
    "{{BODY}}": body,
  };
  for (const [k, v] of Object.entries(rep)) html = html.split(k).join(v);
  const out = join(opts.cwd ?? process.cwd(), "teardown", meta.slug, "index.html");
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, html);
  return out;
}
