## Task

#1 (M1) - Fix Collections wrapper textbox layout so it anchors right, not stacked under description

## Context

Sub-tasks 1 and 2 identified the root cause (Obsidian's `.setting-item-control` defaulting to `flex-direction: row`, which pushed the wrapper input onto a new line) and applied inline style overrides to the Collections item wrapper setting. The build has succeeded twice. This plan covers confirming the build artifact is clean and documenting the visual verification step that requires a live Obsidian instance.

## Approach

Run `npm run build` once more to confirm no TypeScript errors or bundler warnings. Visual confirmation of the layout fix must be done manually inside Obsidian - it cannot be automated.

## Critical Files

- `src/settings-tab.ts` lines 619-691 - Collections item wrapper setting block with the layout fix
- `main.js` (build output) - the compiled artifact loaded by Obsidian

## Reuse

No new code is needed. The fix is already applied at:
- `s.controlEl.style.flexDirection = "column"` (line 634)
- `s.controlEl.style.alignItems = "flex-end"` (line 635)
- `s.controlEl.style.flexShrink = "0"` (line 636)
- `s.controlEl.style.minWidth = "14em"` (line 637)
- `s.settingEl.style.flexWrap = "nowrap"` (line 638)

## Steps

1. From the project root, run `npm run build` and confirm exit code 0 with no TypeScript errors.
2. Verify `main.js` timestamp updates (confirming the artifact was rebuilt from the current source).
3. Proceed to manual visual verification (see Verification below).

## Verification

### Manual tests

1. Copy `main.js`, `manifest.json`, and `sql-wasm.wasm` into the Obsidian vault's `.obsidian/plugins/kobo-highlights-2-obsidian/` directory (or run `npm run deploy` if `.vault-path` is configured). Note: this project has no `styles.css` - the build produces `main.js` and also copies `sql-wasm.wasm` to the project root via `esbuild.config.mjs`.
2. Open Obsidian Settings > Advanced Formatting > scroll to the Collections section > expand it.
3. Confirm the "Collections item wrapper" row displays the text input anchored to the right side of the row, on the same line as the setting name and description - not stacked below the description.
4. Confirm the reset button and warning line appear below the input (not beside the description text).
5. Type a value without `##` in the input, then tab away or click outside the field, and confirm the yellow warning appears correctly positioned beneath the input.
6. Clear the input and type only spaces, then tab away; confirm the "Invisible text" warning appears (the whitespace-only validation path).

### Automated tests

No automated test can verify pixel layout in Obsidian's DOM. A future option would be a Playwright/Puppeteer test against a headless Electron Obsidian instance, but that is out of scope for this milestone.

## Prefect-1 Report

Issues found and fixed in this pass:

**Minor - #5**: Verification step 1 omitted `sql-wasm.wasm` from the list of files to copy. `esbuild.config.mjs` copies `sql-wasm.wasm` to the project root during every build, and `deploy.mjs` explicitly lists all three files (`main.js`, `manifest.json`, `sql-wasm.wasm`) in `FILES_TO_COPY`. Without this file in the plugin directory Obsidian cannot open the SQLite database. Fixed: added `sql-wasm.wasm` to step 1 and noted `npm run deploy` as the recommended deployment method.

**Minor - #6**: Verification step 1 named the plugin directory `.obsidian/plugins/kobo-h2o/`. The actual plugin ID in `manifest.json` and `deploy.mjs` is `kobo-highlights-2-obsidian`, making the correct path `.obsidian/plugins/kobo-highlights-2-obsidian/`. Fixed inline with #5.

All other claims verified against source: `src/settings-tab.ts` lines 619-691 match the plan's Critical Files range and all five Reuse line numbers (634-638) match the actual inline style assignments.

## Prefect-2 Report

**Minor - #7**: The plan file contained two separate `## Changelog` sections. The first covered Reviewer rounds 1-3, and the second was appended by Prefect-1. Fixed: merged both into a single `## Changelog` section.

**Minor - #8**: Verification step 5 did not instruct the tester to leave the field. The actual `validate()` call is wired to `blur` only (`input.addEventListener("blur", ...)`); focus events suppress the warning (`input.addEventListener("focus", () => hideWarn())`). Without tabbing away or clicking outside, the warning will never appear. Step 6 correctly includes "then tab away" -- step 5 now follows the same pattern.

All other plan claims verified: esbuild.config.mjs copies sql-wasm.wasm to project root; deploy.mjs FILES_TO_COPY = ["main.js", "manifest.json", "sql-wasm.wasm"]; PLUGIN_ID = "kobo-highlights-2-obsidian" matches manifest.json; settings-tab.ts lines 619-691 and Reuse lines 634-638 all confirmed correct.

## Changelog

### Review - 2026-04-01
- #1: Added missing `minWidth:"14em"` (line 637) to Reuse section -- it was omitted from the four-item list but present in the source
- #2: Added manual test step 6 to cover the whitespace-only input ("Invisible text") validation branch

### Review - 2026-04-01 (Reviewer #2)
- #3: Corrected Critical Files end line from 688 to 691 -- the setting block closes at line 691, not 688

### Review - 2026-04-01 (Reviewer #3)
- #4: Removed non-existent `styles.css` from Verification step 1 -- this project has no CSS build output; `npm run build` produces only `main.js`

### Review - 2026-04-01 (Prefect-1)
- #5: Added `sql-wasm.wasm` to Verification step 1 -- build script copies it to project root and deploy.mjs requires all three files; omitting it would break the plugin at runtime
- #6: Corrected plugin directory name from `kobo-h2o` to `kobo-highlights-2-obsidian` -- matches the id field in manifest.json and PLUGIN_ID in deploy.mjs

### Review - 2026-04-01 (Prefect-2)
- #7: Merged duplicate `## Changelog` sections into one -- Prefect-1 had appended a second heading; combined all entries under a single section
- #8: Added "then tab away or click outside the field" to Verification step 5 -- validate() fires on blur only; without leaving the field the warning never appears

## Progress

- Step 1: Ran `npm run build` -- exited 0 with no TypeScript errors, no bundler warnings
- Step 2: Verified `main.js` timestamp updated to Apr 1 03:53 confirming rebuild from current source
- Step 3: Manual visual verification required in live Obsidian instance (cannot be automated)

## Implementation
Complete -- 2026-04-01
