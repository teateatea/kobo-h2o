# Plan: Conditional Template Syntax (#10)

## Context
Templates currently support plain `{{variable}}` substitution. There is no way to conditionally show/hide template text based on whether a variable has a value. This feature adds a conditional block syntax that enables flexible callout-style templates, series metadata, and other optional-field patterns. It is also foundational infrastructure for the colour-tag feature (#9).

## Syntax Rules (confirmed with user)
- `{{tag|N}}` — renders the tag's value; **activates condition group N** if the tag is non-empty
- `{{N|text}}` — renders `text` only if condition group N is active; `text` may contain nested `{{}}` tokens
- Group numbers are **global** across the entire template string
- Empty/missing tag → **deactivates** its group
- Groups with no `{{tag|N}}` registration are **shown by default** (unreferenced = always visible)
- Nesting is supported: `{{1|{{2|, }}}}`

## Architecture

### Pre-processing approach
Rather than rewriting the render pipeline, add a **pre-processing step** that runs before the existing `applyVarsMultiline` logic:

1. **Parse** the template into an AST (depth-aware, handles nesting)
2. **Scan** the AST to determine which groups are active (given current `vars`)
3. **Render** the AST back to a plain-variable string (only `{{key}}` tokens remain)
4. The **existing** `applyVars` / `applyVarsMultiline` logic then handles the rest unchanged

This is minimally invasive — no changes to `applyVars`, no changes to callers, no schema changes.

## Files to Create/Modify

### New: `src/template-parser.ts`
Contains all conditional logic. Exports one public function:

```typescript
export function preprocessConditionals(template: string, vars: Record<string, string>): string
```

**Internal types:**
```typescript
type TemplateNode =
  | { type: "literal";    text: string }
  | { type: "variable";   key: string }
  | { type: "cond-var";   key: string; group: number }   // {{key|N}}
  | { type: "cond-block"; group: number; children: TemplateNode[] }; // {{N|text}}
```

**`parseNodes(template)`** — depth-aware parser:
- Scans char-by-char; on `{{`, counts `{{`/`}}` depth to find matching close
- Extracts content between outer braces
- If content has `|`: left side is pure digits → `cond-block`; right side is pure digits → `cond-var`; neither → `variable` (key = full content, preserves existing behaviour)
- No `|` → `variable`
- Module-level `Map<string, TemplateNode[]>` parse cache keyed on template string

**`collectGroupState(nodes, vars)`** — recursive walk:
- Collects `registered` set (all groups that have a `cond-var`)
- Collects `active` set (groups whose `cond-var` tag is non-empty in `vars`)

**`renderNodes(nodes, vars, active, registered)`** — recursive render:
- `literal` → emit text
- `variable` / `cond-var` → emit `{{key}}` (leaves value substitution to `applyVars`)
- `cond-block` → emit children only if `!registered.has(group) || active.has(group)`

**`preprocessConditionals`** — fast path: if template has no `|`, return as-is.

### Modified: `src/renderer.ts`

**`applyVarsMultiline`** (lines 343-362) — two changes:

1. Add pre-processing call at the top:
   ```typescript
   const processed = preprocessConditionals(template, vars);
   // then split `processed` instead of `template`
   ```

2. In the `omitEmptyLines` branch, also drop lines that are blank after conditional suppression:
   ```typescript
   if (omitEmptyLines && line.trim() === "") return null;
   ```
   (Add this check **before** the existing `varTokens` check)

Add import at top of file:
```typescript
import { preprocessConditionals } from "./template-parser";
```

## Disambiguation Logic (edge cases)

| Token | Left | Right | Result |
|-------|------|-------|--------|
| `{{series\|1}}` | `series` (non-digit) | `1` (digit) | `cond-var` |
| `{{1\|Series:}}` | `1` (digit) | `Series:` | `cond-block` |
| `{{title}}` | — | — | `variable` |
| `{{date\|formatted}}` | `date` | `formatted` (non-digit) | `variable` (key=`date\|formatted`, renders empty — existing behaviour; note: with `omitEmptyLines`, a line containing only this token will be suppressed since `vars["date\|formatted"]` is always `""`) |

## Worked Example
Template: `{{1|Series:}}{{series|1}}{{1|{{2|, }}}}{{2|#}}{{series_number|2}}`

- `series="Dune"`, `series_number="3"` → groups 1 & 2 active → `Series:{{series}}, #{{series_number}}` → `Series:Dune, #3`
- `series="Dune"`, `series_number=""` → group 1 active, group 2 inactive → `Series:{{series}}` → `Series:Dune`
- `series=""`, `series_number="3"` → group 1 inactive, group 2 active → `#{{series_number}}` → `#3`

## Verification
1. Write unit tests in a companion `test/` file covering:
   - Basic `{{tag|N}}` activation/suppression
   - Unreferenced groups shown by default
   - Nested `{{1|{{2|text}}}}`
   - Multi-tag same-group: `{{a|1}}{{b|1}}` — group active if either has value
   - Malformed/unclosed `{{` treated as literal
   - Fast path (no `|` in template) returns unchanged string
2. Manual test in Obsidian: configure a highlight template with the series example, import a book with/without series data, verify correct output for each combination
3. Confirm existing templates (no `|`) are unaffected by the pre-processing step
