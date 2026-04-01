# Plan: M1-116 sub-task 2 -- Cull Trailing Blank Lines

## Task

#116 sub-task 2 -- Implement the cull policy: strip trailing blank lines from each template's rendered output at its call site.

## Context

The audit in `M1-116-trailing-blank-audit.md` identified five call sites in `src/renderer.ts` that do not strip trailing blank lines from their rendered output. One site (`renderAnnotation`, L209) already uses `.trim()` and is correct. This plan implements `.trimEnd()` at each of the remaining five sites. No changes are made inside `applyVarsMultiline` itself -- the fix is applied at each caller so the function's contract stays stable.

## Critical Files

- `src/renderer.ts` -- all five edits are in this file

## Approach

Apply `.trimEnd()` at each of the five identified call sites. Each change is a one-line edit. The assembly logic in `renderBookNote` and `renderAppendBlock` controls blank-line spacing between sections, so culling trailing blanks from template output does not remove meaningful separation.

## Steps

1. **Edit `renderFrontmatter` (L75)** -- change `return rendered + "\n";` to `return rendered.trimEnd() + "\n";`

2. **Edit `renderNoteHeading` (L94)** -- change `return applyVarsMultiline(tmpl, vars, settings.noteHeadingOmitEmptyLines);` to `return applyVarsMultiline(tmpl, vars, settings.noteHeadingOmitEmptyLines).trimEnd();`

3. **Edit `renderHighlight` (L191)** -- change `return rendered + "\n\n---\n";` to `return rendered.trimEnd() + "\n\n---\n";`

4. **Edit `renderFooter` (L228)** -- change `return applyVarsMultiline(tmpl, vars, settings.footerOmitEmptyLines);` to `return applyVarsMultiline(tmpl, vars, settings.footerOmitEmptyLines).trimEnd();`

5. **Edit `renderAppendBlock` heading assignment (L252)** -- change the expression `applyVarsMultiline(settings.appendHeadingTemplate, headingVars, settings.appendHeadingOmitEmptyLines)` to append `.trimEnd()`, so `heading` is trimmed before being pushed onto `lines`.

6. **Verify no regressions** -- confirm `renderAnnotation` (L209) already has `.trim()` and is unchanged.

## Reuse

- `.trimEnd()` is native JavaScript String -- no imports needed.
- Pattern is identical to the existing `.trim()` in `renderAnnotation` (L209).

## Verification

### Manual tests

- Author a template that ends with one or more blank lines (e.g. `highlightTemplate` ending in `\n\n`). Import a book and confirm the assembled note does not contain extra blank lines before the `---` separator.
- Author a template with no trailing blank lines and confirm the assembled note is unchanged.
- Verify `renderFrontmatter` output: YAML block ends cleanly with a single trailing newline; no extra blank lines after the closing `---` of frontmatter.

### Automated tests

- No existing test suite in this project (no `.test.ts` files found). Manual verification is the only available mechanism.

## Changelog

### 2026-04-01
- Plan created based on audit findings in M1-116-trailing-blank-audit.md

## Implementation
Complete -- 2026-04-01

## Progress
- Step 1: Added .trimEnd() to renderFrontmatter return: `return rendered.trimEnd() + "\n";`
- Step 2: Added .trimEnd() to renderNoteHeading return value
- Step 3: Added .trimEnd() to renderHighlight return: `return rendered.trimEnd() + "\n\n---\n";`
- Step 4: Added .trimEnd() to renderFooter return value
- Step 5: Added .trimEnd() to renderAppendBlock heading assignment
- Step 6: Confirmed renderAnnotation (L209) already has .trim() -- unchanged
