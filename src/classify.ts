// Decide what kind of target this is and which skill should handle it.
// Lawful access is not guessed here. The skill asks the user; the server records the answer
// and refuses to create a blueprint without a complete attestation (see aup.ts).
import type { Domain } from "./store.js";

export interface Classification {
  kind: "file" | "url" | "text";
  domain: Domain;
  skill: string;
  reaCandidate: boolean;
  notes: string[];
}

const SOFTWARE_EXT = /\.(apk|aab|ipa|app|dmg|pkg|exe|msi|dll|so|dylib|jar|zip|bin|hex|elf|wasm|js|mjs|py)$/i;
const MEDIA_EXT = /\.(mp4|mov|mkv|webm|mp3|wav|aiff|flac)$/i;

const HINTS: { re: RegExp; domain: Domain }[] = [
  { re: /\b(mic|camera|drone|controller|remote|sensor|bulb|plug|thermostat|speaker|headset|gimbal|receiver|transmitter|ble|bluetooth|firmware|board|esp32|raspberry|pi\b|usb|hdmi|sdi)\b/i, domain: "device" },
  { re: /\b(ad|spot|commercial|trailer|scene|film|movie|short film|music video|documentary|shot list|cinematograph)/i, domain: "film-ad" },
  { re: /\b(editor|editing style|cut rhythm|pacing|montage|color grade|grading|transitions?)\b/i, domain: "edit-style" },
  { re: /\b(viral|format|hook|retention|tiktok|reel|short-form|shorts|creator|thumbnail|series)\b/i, domain: "viral-format" },
  { re: /\b(company|business|startup|funnel|saas|pricing|newsletter|brand|store|shop|agency|offer|retention curve)\b/i, domain: "company" },
  { re: /\b(my (site|website|app|domain)|our (site|website|app)|security read|headers|exposed|vibe[- ]coded)\b/i, domain: "own-site" },
  { re: /\b(app|apk|ipa|binary|protocol|api|sdk|plugin|software|client|server|bundle|package)\b/i, domain: "software" },
];

export const SKILL_FOR: Record<Domain, string> = {
  software: "software (hands the heavy lifting to REA)",
  device: "device",
  "film-ad": "film-ad",
  "edit-style": "edit-style",
  "viral-format": "viral-format",
  company: "company",
  "own-site": "own-site",
};

export function classify(input: string): Classification {
  const s = input.trim();
  const notes: string[] = [];
  let kind: Classification["kind"] = "text";
  if (/^https?:\/\//i.test(s)) kind = "url";
  else if (/^(\.|\/|~|[A-Za-z]:\\)/.test(s) || /\.[a-z0-9]{2,5}$/i.test(s)) kind = "file";

  let domain: Domain | null = null;
  if (kind === "file" && SOFTWARE_EXT.test(s)) domain = "software";
  else if (kind === "file" && MEDIA_EXT.test(s)) domain = "film-ad";
  if (!domain) for (const h of HINTS) if (h.re.test(s)) { domain = h.domain; break; }
  if (!domain) {
    domain = kind === "url" ? "company" : "device";
    notes.push("Domain guessed from the shape of the input. Confirm with the user.");
  }
  if (kind === "url" && domain === "viral-format") notes.push("Only analyse what is viewable without logging in.");
  if (domain === "own-site") notes.push("Ownership must be verified with own_site.verify before any read.");
  const reaCandidate = domain === "software";
  if (reaCandidate) notes.push("Software target: REA does the unpacking and protocol work; Reversium keeps the blueprint and runs the loop.");
  return { kind, domain, skill: SKILL_FOR[domain], reaCandidate, notes };
}
