---
name: verify
description: Build/launch/drive recipe for verifying Build-a-Hooper changes end-to-end in the browser.
---

# Verifying Build-a-Hooper

- Launch: `npm run dev` (Vite, http://localhost:5173). Drive with Playwright MCP.
- State: the whole run is persisted to localStorage on every state change (`src/state/persistence.ts`) and offered back via a **Resume** prompt on the landing screen. The Playwright profile keeps saves between sessions.
- To jump to a mid-run screen: edit the localStorage snapshot (the key whose value contains a distinctive field, e.g. `playoffGamesRevealed`), **then reload**, then click Resume. Order matters — the app reads the snapshot at init and re-saves on every state change, so edits made after Resume get clobbered.
- Playoffs/finals reveals are driven by an auto-ticker that only starts after the user clicks the tip-off button ("Tip Off the Playoffs"); sample the DOM on an interval to observe progressive reveals.
- Refs from `browser_snapshot` go stale quickly (constant re-renders); prefer `browser_evaluate` with text-based `querySelector` lookups for clicking.
- Gotcha: Playwright screenshots with relative filenames land in the repo root — move them to the scratchpad afterward. `.playwright-mcp/` contains a tracked `.yml` file; don't `rm -rf` it.
