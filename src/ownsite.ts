// Security reads happen only on a site the user controls. Proof first, then a read-only look.
// Verification: a DNS TXT record at _reversium.<domain>, or a file at /.well-known/reversium.txt.
// The read itself is one HEAD/GET of the homepage: response headers only. No crawling, no probing.
import { resolveTxt } from "node:dns/promises";
import { randomBytes } from "node:crypto";
import { writeText } from "./store.js";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { root } from "./store.js";

export function normalizeDomain(d: string) {
  return d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
}

export async function challenge(domain: string, cwd?: string) {
  const d = normalizeDomain(domain);
  const token = `reversium-verify=${randomBytes(12).toString("hex")}`;
  await writeText(`ownsite/${d}.token`, token, cwd);
  return {
    domain: d,
    token,
    options: [
      `DNS: add a TXT record at _reversium.${d} with the value ${token}`,
      `File: serve ${token} as plain text at https://${d}/.well-known/reversium.txt`,
    ],
  };
}

export async function verify(domain: string, cwd?: string): Promise<{ domain: string; verified: boolean; how?: string; detail: string }> {
  const d = normalizeDomain(domain);
  const p = join(root(cwd), "ownsite", `${d}.token`);
  if (!existsSync(p)) return { domain: d, verified: false, detail: "No challenge issued for this domain. Call own_site.challenge first." };
  const token = (await readFile(p, "utf8")).trim();
  try {
    const txt = await resolveTxt(`_reversium.${d}`);
    if (txt.some((parts) => parts.join("").trim() === token)) {
      await writeText(`ownsite/${d}.verified`, new Date().toISOString(), cwd);
      return { domain: d, verified: true, how: "dns", detail: `TXT at _reversium.${d} matches.` };
    }
  } catch { /* no record yet */ }
  try {
    const res = await fetch(`https://${d}/.well-known/reversium.txt`, { redirect: "follow" });
    if (res.ok && (await res.text()).trim() === token) {
      await writeText(`ownsite/${d}.verified`, new Date().toISOString(), cwd);
      return { domain: d, verified: true, how: "file", detail: `/.well-known/reversium.txt matches.` };
    }
  } catch { /* unreachable */ }
  return { domain: d, verified: false, detail: "Token not found in DNS or at /.well-known/reversium.txt yet. DNS can take minutes to propagate." };
}

export function isVerified(domain: string, cwd?: string) {
  return existsSync(join(root(cwd), "ownsite", `${normalizeDomain(domain)}.verified`));
}

const HEADERS = ["content-security-policy", "strict-transport-security", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy", "server", "x-powered-by"];

export async function headersRead(domain: string, cwd?: string) {
  const d = normalizeDomain(domain);
  if (!isVerified(d, cwd)) return { ok: false, detail: "Not verified. Refused: AUP · You may not · 6." };
  const res = await fetch(`https://${d}/`, { method: "GET", redirect: "follow" });
  const present: Record<string, string> = {};
  const missing: string[] = [];
  for (const h of HEADERS) {
    const v = res.headers.get(h);
    if (v) present[h] = v; else if (!["server", "x-powered-by"].includes(h)) missing.push(h);
  }
  const notes: string[] = [];
  if (present["server"] || present["x-powered-by"]) notes.push("Server software is disclosed in headers; consider removing.");
  if (!present["strict-transport-security"]) notes.push("No HSTS: browsers may accept a plain-HTTP first request.");
  if (!present["content-security-policy"]) notes.push("No CSP: any injected script can run with full page powers.");
  return { ok: true, status: res.status, finalUrl: res.url, present, missing, notes, scope: "One request to the homepage. Headers only. Nothing else was touched." };
}
