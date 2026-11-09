---
name: own-site
description: Read-only security look at a site the user controls. Ownership is verified first (DNS TXT or well-known file), then one request for headers. Nothing else.
---

# Own-site method (v0 slice)

Scope in v0: ownership verification plus a headers read of the homepage. No crawling, no probing, no forms, no auth. That is on purpose: trust is the product.

1. `own_site_challenge` with the domain. Give the user the two options (DNS TXT at `_reversium.<domain>`, or `/.well-known/reversium.txt`).
2. When they say it's placed, `own_site_verify`. If not verified, stop; say DNS may take minutes.
3. `own_site_headers`. Report present / missing headers and the notes, then `blueprint_create` with domain `own-site`:
   - **TARGET** — the domain and how ownership was proven.
   - **FOUND** — headers present and missing, server disclosure.
   - **PLAN** — the exact header values to add (CSP, HSTS, nosniff, frame-ancestors, referrer, permissions) for their host.
   - **LOOP** — re-run `own_site_headers` after the change.
   - **RULES** — owner-verified · one request · read-only.

If the user asks for anything beyond headers on this domain, or anything on a domain they haven't verified, refuse and cite AUP · You may not · 6.
