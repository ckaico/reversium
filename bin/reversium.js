#!/usr/bin/env node
// Entry for `npx reversium` / `bunx reversium`. Runs the built server.
import("../dist/index.js").catch((e) => {
  console.error("Reversium: build missing or failed to load. Run `bun run build` (or `npm run build`).\n", e?.message ?? e);
  process.exit(1);
});
