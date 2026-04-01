# Plan: M1-116 — Trailing Blank Line Audit

## Task

#116 — Define behavior for trailing blank lines at end of template

## Context

Templates in `renderer.ts` are rendered via `applyVarsMultiline`, which does not strip trailing blank lines from its output. When users author templates that end with a blank line, those blank lines propagate into the assembled note, producing unexpected gaps. The sub-task is to audit every template rendering call site, document what each currently returns, and confirm the correct policy: trailing blank lines in each template's rendered output should be culled before assembly.

## Approach

Read every call site in `renderer.ts` that invokes `applyVarsMultiline` (or `applyVars` for word templates), document the current return value, and verify whether `.trimEnd()` is already applied. Then confirm the policy with a precise audit table and record the required fix for each site. This sub-task is documentation and policy confirmation only -- no code changes are implemented here. The output is the completed plan file itself (an audit record), which drives sub-task 2 (implementation).

## Critical Files

- `src/renderer.ts` -- all template rendering logic; line numbers below reference this file

## Reuse

- `applyVarsMultiline` (line 463) -- existing multiline renderer; trailing culling will be applied to its callers, not inside it, to keep its contract stable
- `renderAnnotation` (line 194) -- already applies `.trim()` to its output; this is the correct pattern to replicate

## Steps

1. **Audit each call site** and record current trailing-blank-line behavior:

   | Function | Template setting | Guard trim? | Output suffix | Trailing blanks culled? |
   |---|---|---|---|---|
   | `renderFrontmatter` (L47) | `frontmatterTemplate` | yes (`.trim()` on input) | `rendered + "\n"` | No -- appends raw rendered output |
   | `renderNoteHeading` (L80) | `noteHeadingTemplate` | yes (`.trim()` on input) | raw `applyVarsMultiline` | No |
   | `renderHighlight` (L163) | `highlightTemplate` | no | `rendered + "\n\n---\n"` | No -- extra blank lines before `---` if template ends blank |
   | `renderAnnotation` (L194) | `annotationTemplate` | no | `.trim()` applied | Yes -- trimmed already |
   | `renderFooter` (L214) | `footerTemplate` | yes (`.trim()` on input) | raw `applyVarsMultiline` | No |
   | `renderAppendBlock` heading (L251) | `appendHeadingTemplate` | yes (`.trim()` on input) | raw `applyVarsMultiline` | No |

2. **Confirm the policy**: Trailing blank lines are culled from each template's rendered output so they do not create unexpected blank lines in the assembled note. The blank lines that separate note sections are controlled by the assembly logic in `renderBookNote` and `renderAppendBlock`, not by the templates themselves.

3. **Note exceptions**:
   - `renderFrontmatter` already appends `"\n"` after the rendered block; culling trailing blanks from `rendered` before appending is correct.
   - `renderAnnotation` is already correct (uses `.trim()`).
   - `renderHighlight` appends `"\n\n---\n"` unconditionally; culling trailing blanks from `rendered` before appending `"\n\n---\n"` is correct.

4. **Record required code changes** (to be implemented in sub-task 2):
   - `renderFrontmatter` L75: change `return rendered + "\n";` to `return rendered.trimEnd() + "\n";`
   - `renderNoteHeading` L94: change `return applyVarsMultiline(...)` to `return applyVarsMultiline(...).trimEnd();`
   - `renderHighlight` L191: change `return rendered + "\n\n---\n";` to `return rendered.trimEnd() + "\n\n---\n";`
   - `renderFooter` L228: change `return applyVarsMultiline(...)` to `return applyVarsMultiline(...).trimEnd();`
   - `renderAppendBlock` heading L252: change the `applyVarsMultiline(...)` assignment on L252 to append `.trimEnd()`, so `heading` is trimmed before being pushed onto `lines`

5. **Verify audit completeness** by checking `renderWordListNote` and `renderWord` -- these do not use `applyVarsMultiline` for template blocks and are not affected by this policy (their structure is fixed code, not user templates).

## Verification

### Manual tests

- No code changes in this sub-task; verification is review of the audit table above against `src/renderer.ts`.
- Open `src/renderer.ts` and confirm each call site matches the audit table entries.

### Automated tests

- No tests to write for this sub-task (audit only).
- Sub-task 2 (implementation) will add unit tests that pass a template with a trailing blank line and assert the assembled output does not contain the extra blank line.

## Changelog

### Review - 2026-04-01
- #1 (nit): Clarified wording of `renderAppendBlock` heading fix in Step 4 to specify that the `.trimEnd()` is appended to the L252 assignment expression, not a push call

## Progress

- Step 1: Audited all six call sites in renderer.ts; confirmed audit table entries match actual source (renderFrontmatter L75, renderNoteHeading L94, renderHighlight L191, renderAnnotation L209, renderFooter L228, renderAppendBlock heading L252)
- Step 2: Confirmed policy -- trailing blank lines are culled from each template's rendered output; section spacing is controlled by assembly logic, not templates
- Step 3: Noted exceptions -- renderFrontmatter appends "\n" after rendered block; renderAnnotation is already correct (.trim()); renderHighlight appends "\n\n---\n" unconditionally
- Step 4: Recorded required code changes for sub-task 2 (renderFrontmatter L75, renderNoteHeading L94, renderHighlight L191, renderFooter L228, renderAppendBlock heading L252)
- Step 5: Verified renderWordListNote and renderWord use fixed code structure (not user templates via applyVarsMultiline); confirmed not affected by this policy

## Implementation
Complete - 2026-04-01
