---
name: bullshit
description: Is it bullshit? Paste a repo, link or tool name. Finds what it really is, what already beats it, how old the tech under it is, what's actually proprietary, and whether you could build better yourself. Saves a dated, scored verdict.
---

# /bullshit <repo, link or name>

Answer one question: is this as good as the hype says, compared with what exists right now?

1. **Pin the target.** If the user typed a name, search for it and confirm which project they mean (name, link, author). One question at most.

2. **Read the target itself.** README, docs, paper, model card, release notes, the code if it's public. Write down:
   - **CLAIM**: what it says it does, in its own framing.
   - **INSIDE**: what it actually is. Which model or method, trained on what, when; how much is original vs. a wrapper, a fine-tune or a known technique with new packaging.

3. **Check the field, today.** Search for the strongest alternatives for the same job: open models, papers, plugins, commercial tools. Note release dates. Look for independent comparisons and benchmarks, not just the authors' own. If something is better for part of the job (for example hair, speed or licence), name it for that part.

4. **Score it**, 0–5, with a reason for each:
   - **novelty**: was the idea new?
   - **edge**: how it compares with the best alternative now
   - **moat**: what it has that isn't public (data, weights, hardware, users)
   - **substance**: evidence vs. branding
   - **freshness**: how current the tech under it is
   - **rebuild**: how hard it would be to build an equal or better version today

5. **Rebuild plan.** Concretely: which public parts, how they fit, roughly how long. If it can't be beaten with public parts, say why.

6. **Save.** Call `verdict_save`. The server computes the verdict (Real deal · Good, not special · Mostly branding · Bullshit) and refuses scores without reasons, fewer than two sourced URLs, or a low edge with nothing named as better. Fix what it lists and save again.

7. **Answer in three lines:** the verdict, the one thing that's actually better (or "nothing beats it"), and whether to build your own.

Rules: public information only, nothing from behind a login. Separate what you checked from what you're inferring. Respect the work: "already exists" is not an insult, and viral is not the same as bad. Every verdict carries the date it was checked, because the field moves monthly.
