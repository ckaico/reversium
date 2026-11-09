---
name: loop
description: One round of the build-and-compare loop against a saved blueprint. Your attempt vs. the reference, section by section, then exactly one change.
---

# /loop <slug> [what I built this round]

1. If the user didn't say what they built, ask for it in two sentences. Then express it in the blueprint's section keys (`attempt`).
2. Call `loop_compare` with `slug`, `attempt`, and `attemptNote`.
3. Report the gap table as-is and the **one change** it picked. Do not add a second recommendation.
4. If the result says there are no gaps, the loop turns: ask where theirs should diverge on purpose, and why. That is the point where a copy becomes an original.
5. If the attempt revealed something new about the target itself, call `blueprint_update` with a note so the reference grows too.

Never pad. One round, one change, saved.
