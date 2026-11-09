// Section-level diff between two blueprint versions. Plain, readable, no library.
import type { Sections } from "./store.js";

export interface SectionDiff { section: string; change: "added" | "removed" | "changed" | "same"; before?: string; after?: string }

export function diffSections(a: Sections, b: Sections): SectionDiff[] {
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  return keys.map((k) => {
    const x = (a[k] ?? "").trim(), y = (b[k] ?? "").trim();
    if (!x && y) return { section: k, change: "added", after: y };
    if (x && !y) return { section: k, change: "removed", before: x };
    if (x === y) return { section: k, change: "same" };
    return { section: k, change: "changed", before: x, after: y };
  });
}

export function renderDiff(slug: string, va: number, vb: number, d: SectionDiff[]) {
  const changed = d.filter((x) => x.change !== "same");
  if (!changed.length) return `# Diff · ${slug} · v${va} → v${vb}\n\nNo changes.\n`;
  return (
    `# Diff · ${slug} · v${va} → v${vb}\n\n` +
    changed
      .map((x) => {
        if (x.change === "added") return `## ${x.section} · added\n${x.after}\n`;
        if (x.change === "removed") return `## ${x.section} · removed\n~~${x.before}~~\n`;
        return `## ${x.section} · changed\n**before**\n${x.before}\n\n**after**\n${x.after}\n`;
      })
      .join("\n")
  );
}
