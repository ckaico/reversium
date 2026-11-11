// Smoke test: start the server over stdio, exercise every tool in a temp project, print results.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const cwd = mkdtempSync(join(tmpdir(), "reversium-smoke-"));
const transport = new StdioClientTransport({ command: "bun", args: ["run", join(import.meta.dir, "../src/index.ts")], cwd });
const client = new Client({ name: "smoke", version: "0.0.0" });
await client.connect(transport);

const tools = (await client.listTools()).tools.map((t) => t.name);
console.log("tools:", tools.join(", "));

async function call(name: string, args: Record<string, unknown>) {
  const r = await client.callTool({ name, arguments: args });
  const t = (r.content as { type: string; text?: string }[]).map((c) => c.text ?? "").join("\n");
  console.log(`\n== ${name}\n${t.slice(0, 600)}${t.length > 600 ? "\n…" : ""}`);
  return t;
}

const ok = { access: "owned", statement: "My own lavalier mic, bought retail, on my desk.", noCircumvention: true, noSafetySystems: true, noPrivateData: true };
const bad = { ...ok, noCircumvention: false };

await call("target_classify", { input: "./vendor-app.apk" });
await call("target_classify", { input: "a wireless mic to my iPhone" });
const refused = await call("blueprint_create", { target: "wireless mic", domain: "device", attestation: bad, sections: { TARGET: "x" } });
if (!/Refused/.test(refused)) throw new Error("expected a refusal");
await call("blueprint_create", { target: "wireless mic → phone", domain: "device", attestation: ok, sections: { TARGET: "Wireless lavalier mic, owned.", INSIDE: "BLE control, proprietary 2.4 GHz audio.", PLAN: "Bridge board exposing a standard BLE device." } });
await call("blueprint_update", { slug: "wireless mic → phone", sections: { FOUND: "Control service with 3 characteristics." }, note: "first capture" });
await call("blueprint_diff", { slug: "wireless-mic-phone", from: 1 });
await call("loop_compare", { slug: "wireless-mic-phone", attempt: { TARGET: "same", PLAN: "ESP32 bridge, pairs." }, attemptNote: "v1 bridge pairs; audio not yet." });
await call("blueprint_list", {});
await call("rea_handoff", { target: "./vendor-app.apk", attestation: { ...ok, statement: "APK from my own device, app I use." } });
await call("own_site_challenge", { domain: "https://example.com/" });
await call("own_site_verify", { domain: "example.com" });
await call("own_site_headers", { domain: "example.com" });
await call("teardown_render", { slug: "wireless-mic-phone", submitter: "Christian" });

const sc = (n: number) => ({ score: n, why: "checked against the public repo and two alternatives" });
const thin = await call("verdict_save", { target: "demo tool", claim: "x", inside: "y", scores: { novelty: sc(1), edge: sc(1), moat: sc(0), substance: sc(3), freshness: sc(2), rebuild: sc(1) }, better: [], rebuildPlan: "z", sources: [{ url: "https://example.com", what: "readme" }] });
if (!/Not saved/.test(thin)) throw new Error("expected verdict_save to reject thin input");
const saved = await call("verdict_save", { target: "demo tool · https://example.com", claim: "Best matting ever.", inside: "Fine-tune of an open model.", scores: { novelty: sc(1), edge: sc(1), moat: sc(0), substance: sc(3), freshness: sc(2), rebuild: sc(1) }, better: [{ name: "Alt", url: "https://example.org", why: "better edges" }], rebuildPlan: "Use Alt.", sources: [{ url: "https://example.com", what: "readme" }, { url: "https://example.org", what: "benchmark" }] });
if (!/Mostly branding/.test(saved)) throw new Error("expected Mostly branding");
await call("verdict_list", {});

console.log("\nproject dir:", cwd);
await client.close();
