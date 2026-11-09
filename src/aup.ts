// The acceptable-use check. It does not guess intent from wording.
// It requires the user's own attestation, complete and affirmative, and names the clause when it refuses.
import type { Attestation } from "./store.js";

export interface AupResult {
  ok: boolean;
  refusals: { clause: string; text: string }[];
}

export const CLAUSES = {
  access: { clause: "AUP · You may · 1", text: "Analysis is limited to devices you own, software you have licensed, media you can lawfully watch, and pages that are public without logging in." },
  circumvention: { clause: "AUP · You may not · 1", text: "No breaking or working around access controls, licence checks, DRM or encryption." },
  safety: { clause: "AUP · You may not · 2", text: "No modifying or disabling safety systems, flight-restriction systems or regulatory limits." },
  privateData: { clause: "AUP · You may not · 3-4", text: "Nothing from behind a login, nothing leaked, nothing under NDA, no one else's private data." },
  ownSite: { clause: "AUP · You may not · 6", text: "Security reads only on a site you control, after ownership is verified." },
} as const;

export function checkAttestation(a: Attestation | undefined, domain: string, ownSiteVerified = false): AupResult {
  const refusals: AupResult["refusals"] = [];
  if (!a) return { ok: false, refusals: [{ clause: "AUP", text: "No lawful-access attestation was given. Ask the user how they have this target, then call again with `attestation`." }] };
  if (a.access === "unknown" || !a.statement || a.statement.trim().length < 8) refusals.push(CLAUSES.access);
  if (!a.noCircumvention) refusals.push(CLAUSES.circumvention);
  if (!a.noSafetySystems) refusals.push(CLAUSES.safety);
  if (!a.noPrivateData) refusals.push(CLAUSES.privateData);
  if (domain === "own-site" && !ownSiteVerified) refusals.push(CLAUSES.ownSite);
  return { ok: refusals.length === 0, refusals };
}

export function refusalText(r: AupResult) {
  return r.refusals.map((x) => `Refused · ${x.clause}: ${x.text}`).join("\n");
}
