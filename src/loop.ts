// The build-and-compare loop. One round: your attempt vs. the blueprint, section by section,
// and exactly one recommended change. The server structures the comparison; the model fills the judgement.
import { SECTIONS, type Sections } from "./store.js";

export interface Gap {
  section: string;
  reference: string;
  attempt: string;
  status: "missing" | "partial" | "matched" | "diverged-on-purpose";
}

export function compareSections(reference: Sections, attempt: Sections): Gap[] {
  const keys = [...SECTIONS, ...Object.keys(reference).filter((k) => !(SECTIONS as readonly string[]).includes(k))];
  return keys
    .filter((k) => reference[k])
    .map((k) => {
      const ref = reference[k]!.trim();
      const att = (attempt[k] ?? "").trim();
      let status: Gap["status"] = "missing";
      if (att) status = att.length >= ref.length * 0.6 ? "matched" : "partial";
      if (/\bon purpose\b|\bdeliberately\b|\bchose (not )?to\b/i.test(att)) status = "diverged-on-purpose";
      return { section: k, reference: ref, attempt: att, status };
    });
}

export function pickNextChange(gaps: Gap[]): string {
  const order: Gap["status"][] = ["missing", "partial"];
  for (const st of order) {
    const g = gaps.find((x) => x.status === st && x.section !== "RULES");
    if (g) return `${g.section}: ${st === "missing" ? "nothing recorded yet" : "thin against the reference"}. Change this one thing next round and record what happened.`;
  }
  return "No gaps against the reference. Now diverge on purpose: pick the section where yours should differ, and say why.";
}

export function renderRound(slug: string, round: number, version: number, gaps: Gap[], attemptNote: string, next: string) {
  const rows = gaps.map((g) => `| ${g.section} | ${g.status} |`).join("\n");
  return (
    `# Loop · ${slug} · round ${round}\n\n` +
    `against blueprint v${version}\n\n` +
    `## Attempt\n${attemptNote.trim()}\n\n` +
    `## Gaps\n| section | status |\n|---|---|\n${rows}\n\n` +
    `## One change\n${next}\n`
  );
}
