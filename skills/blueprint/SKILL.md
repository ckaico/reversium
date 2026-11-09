---
name: blueprint
description: Read, list, update or diff saved blueprints. "/blueprint diff <slug> 1 3" shows what you learned between versions.
---

# /blueprint [list | get <slug> [v] | update <slug> | diff <slug> <from> [to]]

- `list` → `blueprint_list`.
- `get` → `blueprint_get`. Show the document; don't summarise it away.
- `update` → ask what changed and why, then `blueprint_update` with only the sections that changed and a one-line note. Every update is a new version; nothing is overwritten.
- `diff` → `blueprint_diff`. Then say, in one sentence, what the diff means for the build.

Blueprints live in `./.reversium/blueprints/<slug>/`. They never leave the machine unless the user runs `/teardown publish`.
