// Hand software targets to REA (github.com/morluto/rea, MIT). Reversium does not reimplement
// unpacking, decompilation or protocol capture. It writes a task file REA's agents can pick up,
// and folds REA's findings back into the blueprint when the user pastes them in.
import { basename } from "node:path";
import { writeText } from "./store.js";

export const REA_REPO = "https://github.com/morluto/rea";

export function reaTask(target: string, statement: string) {
  const name = basename(target);
  return (
    `# REA task · ${name}\n\n` +
    `Source: Reversium handoff. REA: ${REA_REPO} (MIT)\n` +
    `Lawful access, in the user's words: ${statement}\n\n` +
    `## Ask\n` +
    `Analyse the observable behaviour of \`${target}\`: what it talks to, over which transports, with what message shapes, ` +
    `and which local endpoints or protocols exist. Do not work around any access control, licence check or DRM. ` +
    `Do not redistribute any of the target's own files.\n\n` +
    `## Return, in this shape (Reversium folds it into the blueprint)\n` +
    `- INSIDE: layers, components, endpoints (local vs cloud)\n` +
    `- TRAFFIC: transports, ports, message formats, auth on the local link\n` +
    `- FOUND: commands or routes, documented vs undocumented\n` +
    `- RISKS: anything that would make a rebuild unsafe or unlawful; stop there\n`
  );
}

export async function writeReaTask(target: string, statement: string, cwd?: string) {
  const p = await writeText(`rea/${basename(target).replace(/[^A-Za-z0-9._-]+/g, "_")}.task.md`, reaTask(target, statement), cwd);
  return { path: p, instructions: `Open the task file in a REA-enabled agent (install: ${REA_REPO}). When REA returns, call blueprint.update with its INSIDE / TRAFFIC / FOUND text.` };
}
