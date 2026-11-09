---
name: software
description: Method for an app, binary or bundle you lawfully have. REA does the unpacking and protocol work; Reversium records the blueprint and runs the loop toward an interoperable client of your own.
---

# Software method

1. Attestation first (see `/reverse`). Software you lawfully have: a package from your own device, an app you licensed, a build you made.
2. `rea_handoff` with the target path. It writes `./.reversium/rea/<name>.task.md`. Run it in a REA-enabled agent (https://github.com/morluto/rea). Reversium does not duplicate REA.
3. When REA returns, `blueprint_create` with:
   - **TARGET** — the package and how it's held.
   - **INSIDE** — layers, components, local vs. cloud endpoints.
   - **TRAFFIC** — transports, ports, formats, auth on the local link (from REA).
   - **FOUND** — commands/routes, documented vs. discovered (from REA).
   - **PLAN** — an interoperable client of the user's own for their own device or data. Interoperability, not circumvention.
   - **LOOP** — v1 goal.
   - **RULES** — lawfully held · no access control worked around · nothing of the target's redistributed.
4. Hand to `/loop` for the build.

If REA's RISKS section says a step would require working around an access control, the blueprint stops at that line and says so.
