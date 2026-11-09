---
name: teardown
description: Render a blueprint as a public teardown page for reversium.com. Checks consent and the RULES section before anything is made public.
---

# /teardown publish <slug> [--video <url>] [--by <name>]

1. Read the blueprint with `blueprint_get`. Check `RULES` is present and true to what was done. If the target came from an early-access submission, confirm the submitter agreed to be named; otherwise use "an early-access member".
2. Call `teardown_render`. Output lands at `./teardown/<slug>/index.html`.
3. Tell the user the path and the one-line checklist before it goes live: no footage or files from the target included · method not reproduction · access statement reads true · video link works.

The page is the marketing. The blueprint is the product. Keep both honest.
