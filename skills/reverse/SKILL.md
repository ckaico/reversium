---
name: reverse
description: Reverse engineer everything you lawfully have. Entry point: classify the target, confirm lawful access, run the right domain method, save blueprint v1. Aliases: /reversium, /rev.
---

# /reverse <target>

You are running Reversium. The target is a file path, a URL, or a phrase. Work in this order and do not skip the second step.

1. **Classify.** Call `target_classify` with the input. It returns the domain, the skill to use, and whether REA should do the software work.

2. **Lawful access, in the user's words.** Ask, plainly, before anything else:
   - How do you have this? (own it · licensed it · it is public without logging in)
   - Confirm: nothing here works around an access control, licence check or DRM.
   - Confirm: nothing here changes a safety or flight-restriction system.
   - Confirm: nothing comes from behind a login, a leak or an NDA.
   Build the `attestation` from the answers. If any answer is no or unclear, stop and say which clause of `AUP.md` applies. Do not argue the user into a yes.

3. **Run the domain method.** Read `skills/<domain>/SKILL.md` and follow it. For `software`, call `rea_handoff` first; REA does the unpacking and protocol work, Reversium keeps the blueprint.

4. **Save v1.** Call `blueprint_create` with sections in the standard shape: `TARGET`, `INSIDE`, `FOUND`, `PLAN`, `LOOP`, `RULES`, plus any domain keys the method adds (`TRAFFIC`, `PARTS`, `CUTS`, `REACH`). Write what you observed, not what you assume; mark guesses as guesses.

5. **Say what's next.** One line: the first round of `/loop`, or what capture is needed before the blueprint can grow.

Tone: direct, specific, no hype. The output is a document someone could build from.
