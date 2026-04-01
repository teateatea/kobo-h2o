## Task

#1 Fix collections item wrapper layout

## Context

Sub-task 1 applied a column-layout fix to `controlEl` in both `collectionsItemWrapper` and `invalidCharSetting`. The fix sets `flexDirection:"column"` and `alignItems:"flex-end"` on `controlEl`, and places `bottomRow` inside `controlEl`. However, the task specification also requires `flexShrink:0` and an adequate `min-width` on `controlEl` so it anchors to the right and does not overflow at narrow panel widths. Neither of those properties was added in sub-task 1. Additionally, the default Obsidian `settingEl` flex container uses `flex-wrap:wrap`, which can still cause `controlEl` to drop to a new line at small widths; this needs to be suppressed for these two settings.

## Approach

Add the three missing style properties directly after the existing column-layout lines in both blocks:

- `s.controlEl.style.flexShrink = "0"` - prevents controlEl from shrinking below its natural width
- `s.controlEl.style.minWidth = "14em"` for collectionsItemWrapper (input is 12em wide, needs headroom for bottomRow)
- `s.controlEl.style.minWidth = "8em"` for invalidCharSetting (input is 6em wide)
- `s.settingEl.style.flexWrap = "nowrap"` on each setting to prevent the row from wrapping

No other changes are needed. The `bottomRow` div and all event logic from sub-task 1 are already correct.

## Critical Files

- `src/settings-tab.ts`
  - Line 634-635: `collectionsItemWrapper` block - existing column-layout lines; add 2 lines after
  - Line 1071-1072: `invalidCharSetting` function - existing column-layout lines; add 2 lines after

## Reuse

No new utilities needed. Uses the same inline `.style` property assignment pattern already present in both blocks.

## Steps

1. In `src/settings-tab.ts`, after line 635 (the `alignItems` line in the `collectionsItemWrapper` block), add `flexShrink`, `minWidth`, and `flexWrap` on `settingEl`:

```
-          s.controlEl.style.alignItems = "flex-end";
+          s.controlEl.style.alignItems = "flex-end";
+          s.controlEl.style.flexShrink = "0";
+          s.controlEl.style.minWidth = "14em";
+          s.settingEl.style.flexWrap = "nowrap";
```

2. In `src/settings-tab.ts`, after line 1072 (the `alignItems` line in `invalidCharSetting`), add the same three properties with a narrower `minWidth`:

```
-  s.controlEl.style.alignItems = "flex-end";
+  s.controlEl.style.alignItems = "flex-end";
+  s.controlEl.style.flexShrink = "0";
+  s.controlEl.style.minWidth = "8em";
+  s.settingEl.style.flexWrap = "nowrap";
```

3. Build the plugin to confirm no TypeScript errors: `npm run build` (or `tsc --noEmit`).

## Verification

### Manual tests

- Open Obsidian Settings > kobo-h2o at a normal panel width (~500px+). Confirm the "Collections item wrapper" row shows the text input right-aligned on the same line as the name/desc, with the bottomRow (warn + Reset) appearing below the input, never beside the name.
- Narrow the settings panel to roughly 300px (or resize Obsidian window to minimum). Confirm the input stays inside `controlEl` on the right; it should not drop below the description or overflow horizontally.
- Confirm the "Replace invalid characters with" row in the Note name section shows the same correct right-anchored layout at both normal and narrow widths.
- Type an invalid value in each field to confirm the warn span appears inside `controlEl` (in the bottomRow below the input), not outside or to the left.
- Click "Reset to default" in each field and confirm it functions correctly and the button hides after click.

### Automated tests

No automated layout tests currently exist. A realistic option would be a Jest + jsdom unit test that constructs a mock `Setting` object, calls `invalidCharSetting` and the `collectionsItemWrapper` block, then asserts `controlEl.style.flexShrink === "0"`, `controlEl.style.minWidth` is set, and `settingEl.style.flexWrap === "nowrap"`. This would guard against regressions if the style assignments are accidentally removed.

## Progress

- Step 1: Added flexShrink, minWidth (14em), and flexWrap to collectionsItemWrapper block in src/settings-tab.ts
- Step 2: Added flexShrink, minWidth (8em), and flexWrap to invalidCharSetting block in src/settings-tab.ts
- Step 3: Build succeeded (npx tsc --noEmit + esbuild) with no TypeScript errors

## Implementation
Complete - 2026-04-01
