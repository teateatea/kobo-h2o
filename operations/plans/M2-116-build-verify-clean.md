## Task

#116 - Define behavior for trailing blank lines at end of template

## Context

`src/renderer.ts` has already been modified to cull trailing blank lines from template output. This plan covers building the project to confirm the TypeScript compiles without errors and the built `main.js` is committed so the fix ships with the plugin.

## Approach

Run `npm run build` (which runs `tsc --noEmit` then `esbuild`) from the project root, verify zero errors, then commit the updated `main.js`.

## Critical Files

- `C:/Users/solar/Documents/Claude Projects/kobo-h2o/main.js` - built artifact to update and commit
- `C:/Users/solar/Documents/Claude Projects/kobo-h2o/src/renderer.ts` - already modified; source of truth for the fix

## Reuse

- `npm run build` script in `package.json` (line 8): runs `npx tsc --noEmit -p tsconfig.json && node esbuild.config.mjs production`

## Steps

1. Run the build from the project root:
   ```
   npm run build
   ```
   Expected: exits 0 with no TypeScript errors or esbuild errors in output.

2. If any TypeScript errors appear, read the error output and fix the relevant lines in the affected source file before proceeding.

3. Stage and commit the updated artifact:
   ```
   git add main.js
   git commit -m "Build: compile main.js after #116 trailing-blank-line fix"
   ```

4. Push to GitHub:
   ```
   git push
   ```

## Verification

### Manual tests

1. In Obsidian with the plugin loaded from the project directory, open Settings and verify the plugin loads without errors in the console.
2. Import a book whose template ends with one or more trailing blank lines (e.g. the default highlight or footer template with extra newlines appended). Open the generated note and confirm no extra blank lines appear at the end of the note body.
3. Import a book whose template has no trailing blank lines. Confirm the note output is unchanged and no content is removed from the middle of the note.

### Automated tests

No test runner is configured yet (see task #59). Once jest/vitest is added, a unit test for `renderBookNote` or `renderFooter` should assert that a template string ending in `\n\n\n` produces output that ends with exactly one newline.

## Prefect-1 Report

### Minor

1. **Step 2 over-specifies the error location** (`M2-116-build-verify-clean.md:30`): The original text said "fix the relevant lines in `src/renderer.ts`", but TypeScript errors from a build could appear in any source file -- not exclusively `renderer.ts`. Since this plan makes no further code changes, the contingency should be generic.
   - Change: "fix the relevant lines in `src/renderer.ts`" -> "fix the relevant lines in the affected source file"

## Changelog

### Review - 2026-04-01
- #1: Generalized Step 2 error-fix instruction from `src/renderer.ts`-specific to "the affected source file"

## Progress
- Step 1: `npm run build` ran successfully - tsc --noEmit passed, esbuild produced main.js, exit 0
- Step 2: No TypeScript errors - skipped
- Step 3: Staged main.js and committed
- Step 4: Pushed to GitHub
