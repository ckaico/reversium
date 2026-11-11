# Reversium

[reversium.com](https://reversium.com) · **Reverse engineer everything.** Jailbreak, but for everything else.

An MCP server and agent skills that turn anything you lawfully have into a **saved, versioned blueprint** and run a **build-and-compare loop** until your version stands on its own. Software goes to [REA](https://github.com/morluto/rea) (MIT). Devices, film and ads, editing styles, viral formats, companies and your own site are Reversium's.

```
/reverse ./vendor-app.apk          → blueprint v1 (REA does the unpacking)
/reverse "my wireless mic → iPhone" → device method: link, capture plan, bridge, parts
/reverse https://…/spot.mp4         → ad method: cuts, rhythm, lenses, sound, shot list
/loop wireless-mic-phone            → your build vs. the blueprint; one change
/blueprint diff wireless-mic-phone 1 3
/teardown publish wireless-mic-phone
/bullshit https://github.com/…/ponytail → is it as good as the hype? scored, dated verdict
```

Every run ends in the same document shape: `TARGET · INSIDE · FOUND · PLAN · LOOP · RULES`, plus domain keys like `TRAFFIC`, `CUTS`, `REACH`, `PARTS`.

## Install

Requires Node 20+ or Bun. Until the first npm publish, run from a clone: `bun install && bun run build`, then point your MCP client at `bin/reversium.js`.

```bash
npx reversium           # after publish; or: bunx reversium
```

Claude Code, `.mcp.json` in your project:

```json
{ "mcpServers": { "reversium": { "command": "npx", "args": ["-y", "reversium"] } } }
```

Skills: copy `skills/` into `.claude/skills/` (or install this repo as a plugin). `/reverse` is the entry point; `/reversium` and `/rev` are aliases.

## What it does that a chat window doesn't

1. **The blueprint persists and versions.** `./.reversium/blueprints/<slug>/v001.md …` Markdown for you, JSON for tools. `blueprint_diff` shows what you learned.
2. **The loop measures.** `loop_compare` lines your attempt up against the reference section by section and hands back exactly one change. When there are no gaps left, it asks where yours should diverge on purpose.
3. **The rules are code.** Every blueprint needs a lawful-access attestation in your own words. Security reads need ownership proof first. Refusals cite the clause in [AUP.md](AUP.md).

## Tools

| tool | what |
|---|---|
| `target_classify` | path / URL / phrase → domain, skill, whether REA should take it |
| `blueprint_create` · `get` · `update` · `diff` · `list` | the saved, versioned document |
| `loop_compare` | one round: attempt vs. reference, one change, saved |
| `rea_handoff` | writes a REA task file for software targets |
| `own_site_challenge` · `verify` · `headers` | prove you own a domain, then one read-only headers check |
| `teardown_render` | blueprint → static page for reversium.com |
| `verdict_save` · `verdict_list` | "Is it bullshit?": scored, sourced, dated verdict on a public tool or repo; the server computes the label |

## What it won't do

Work around access controls or DRM. Touch safety or flight-restriction systems. Log in anywhere or read behind a login. Probe a site you haven't proven you own. Reproduce the target. See [AUP.md](AUP.md); the server enforces the parts it can.

## Local-first

Nothing leaves your machine. No accounts, no telemetry, no cloud. `teardown_render` writes a file; publishing it is your move.

## Develop

```bash
bun install
bun run smoke      # starts the server over stdio and exercises every tool in a temp dir
bun run build      # dist/index.js for the npm bin
```

## Status

v0.1. Built on REA. Trademark and name clearance pending. First public teardown: coming.

Apache 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). "Reversium" is a name, not part of the licence grant.
