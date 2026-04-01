## Task

#1 -- Fix collections item wrapper layout

## Context

The "Collections item wrapper" setting in `src/settings-tab.ts` manually creates an `<input>` element in `controlEl` and then appends a `bottomRow` div to `settingEl` (the outer row element). It also sets `flexWrap: wrap` on `settingEl`. Because Obsidian's `.setting-item` is a flex row, enabling `flexWrap` causes the input (which lives inside `controlEl`) to wrap onto a second line when the row is too narrow, pushing it under the description instead of keeping it anchored to the right.

The same bug exists in the `invalidCharSetting` helper function (lines 1072-1073), which uses the identical pattern.

The correct pattern is already demonstrated by `templateSingleLine` (line 866) and `templateTextarea` (line 980): attach `bottomRow` to `s.controlEl` (not `s.settingEl`), set `controlEl` to `flex-direction: column`, and let the input sit at the top of that column with the bottomRow below it. No `flexWrap` on `settingEl` is needed.

## Approach

For the collections item wrapper inline setting: remove `s.settingEl.style.flexWrap = "wrap"`, switch the `bottomRow` parent from `s.settingEl` to `s.controlEl`, and set `s.controlEl.style.flexDirection = "column"` with `s.controlEl.style.alignItems = "flex-end"` so the input stays right-aligned while the bottomRow (warn + reset) expands below it. Keep `width:100%` on `bottomRow` because `align-items: flex-end` (unlike `stretch`) does not auto-expand flex children to fill the container width.

Apply the same correction to `invalidCharSetting`.

## Critical Files

- `src/settings-tab.ts`
  - Lines 629-640: Collections item wrapper -- `input` creation, `flexWrap` set on `settingEl`, `bottomRow` appended to `settingEl`
  - Lines 1068-1075: `invalidCharSetting` -- same pattern repeated

## Reuse

No new utilities needed. The fix mirrors the existing `controlEl`-based `bottomRow` pattern at lines 866-868 (`templateSingleLine`) and lines 980-982 (`templateTextarea`).

## Steps

1. In the Collections item wrapper block (around line 629), replace the `flexWrap` + `settingEl.createEl` pattern with a `controlEl`-column layout:

```diff
-         s.infoEl.style.flexShrink = "1";
-         s.controlEl.style.flexShrink = "0";
-
-         s.settingEl.style.flexWrap = "wrap";
-         const bottomRow = s.settingEl.createEl("div");
-         bottomRow.style.cssText =
-           "width:100%; display:flex; justify-content:space-between; align-items:center; margin-top:6px;";
+         s.controlEl.style.flexDirection = "column";
+         s.controlEl.style.alignItems = "flex-end";
+
+         const bottomRow = s.controlEl.createEl("div");
+         bottomRow.style.cssText =
+           "width:100%; display:flex; justify-content:space-between; align-items:center; margin-top:6px;";
```

   Note: `s.infoEl.style.flexShrink` and `s.controlEl.style.flexShrink` are removed because the column layout on `controlEl` supersedes the need for manual shrink control. `width:100%` is retained on `bottomRow` because `controlEl` uses `align-items: flex-end` (not `stretch`), so flex children do NOT stretch to fill the container width automatically -- `bottomRow` would otherwise collapse to its content width, breaking `justify-content:space-between`.

2. In `invalidCharSetting` (around line 1072), apply the same change:

```diff
-         s.settingEl.style.flexWrap = "wrap";
-         const bottomRow = s.settingEl.createEl("div");
-         bottomRow.style.cssText =
-           "width:100%; display:flex; justify-content:space-between; align-items:center; margin-top:6px;";
+         s.controlEl.style.flexDirection = "column";
+         s.controlEl.style.alignItems = "flex-end";
+
+         const bottomRow = s.controlEl.createEl("div");
+         bottomRow.style.cssText =
+           "width:100%; display:flex; justify-content:space-between; align-items:center; margin-top:6px;";
```

3. Build and verify: `npm run build`

## Verification

### Manual tests

1. Open Obsidian settings and navigate to the kobo-h2o plugin.
2. Scroll to the "Collections" section and expand it.
3. Confirm the "Collections item wrapper" input box appears on the right side of the row, aligned with the setting name and description -- not beneath the description.
4. Type a value without `##` (e.g. `[[test]]`) and blur -- confirm the yellow warning appears in a row below the input, not pushing the input down.
5. Click "Reset to default" -- confirm button is also in the row below the input.
6. Scroll to the "Advanced Formatting" section and find "Replace invalid characters with".
7. Confirm the input box is anchored right, and the warn/reset row appears below only when triggered.

### Automated tests

No test framework is currently configured (#59). Once jest/vitest is added, a DOM-environment unit test could render each setting element and assert that `controlEl.style.flexDirection === "column"` and that `bottomRow.parentElement === controlEl`.

## Changelog

### Review - 2026-04-01
- #1 (minor): Step 1 diff -- removed `width:100%` from `bottomRow.style.cssText` for consistency with reference patterns (lines 868, 982) and Step 2; added explanatory note on why `flexShrink` lines are removed
- #2 (nit): Removed confusing "either is fine" note that contradicted itself; replaced with single clear rationale in Step 1 note

### Review - 2026-04-01 (R2)
- #1 (blocking): Restored `width:100%` on `bottomRow` in both Step 1 and Step 2 diffs -- `align-items: flex-end` on `controlEl` means flex children do not stretch; without `width:100%`, `bottomRow` collapses to content width and `justify-content:space-between` breaks
- #2 (blocking): Corrected Approach section which still described removing `width:100%` from `bottomRow` -- updated to match corrected steps

## Progress
- Step 1: Replaced flexWrap+settingEl pattern with controlEl column layout for Collections item wrapper (lines ~634-640)
- Step 2: Applied same controlEl column layout fix to invalidCharSetting (lines ~1072-1075)
- Step 3: Build passed (npm run build, no errors)

## Implementation
Complete -- 2026-04-01
