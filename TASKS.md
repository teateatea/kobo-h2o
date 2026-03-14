# Kobo-H2O Task Backlog

Persistent cross-session task list. Update status inline: `[ ]` pending, `[x]` done, `[~]` in progress.

---

## Bugs / Regressions

- [ ] **#9** Restore highlight colour tagging *(was previously working, now broken)*

---

## Quick Wins / High Value

- [ ] **#13** Normalize author separator — convert `;` to `,` between multiple authors
- [ ] **#7** Make heading dividers user-configurable — remove hardcoded `---`, move to default template
- [ ] **#12** Add note creation date as a frontmatter field
- [ ] **#4** Add highlight numbering (#1, #2, #3… per book)
- [ ] **#5** Add highlight spacing setting — single or double spacing between highlights
- [ ] **#6** Add sort order option — sort highlights by date or by page position (ChapterProgress %)

---

## Author / Metadata Formatting

- [ ] **#14** Author name order option — convert `Last, First` → `First Last` and/or reverse
- [ ] **#15** Author name wrappers setting — e.g. `[[First Last]]` per author
- [ ] **#2** Configurable date format options
- [ ] **#21** Title case formatting options — Title_Case, ALL CAPS, etc.
- [ ] **#22** Percent format options — `0.5`, `50`, `50%`, `50PCT`, upper/lower variants

---

## Chapter Title Cleanup *(batch together)*

- [ ] **#16** Chapter title formatting — add space between letters/numbers, apply title case
- [ ] **#17** Strip leading zeros from chapter numbers
- [ ] **#18** Trim X words from start and/or end of chapter titles
- [ ] **#19** Normalize `ch` / `chapter` prefix variants
- [ ] **#20** Symbol normalization — replace uncommon symbols (e.g. `;` → `-`)

---

## Template / Power-User Features

- [ ] **#3** Investigate highlight time storage in SQLite — check if time-of-day is stored, expose it if so
- [ ] **#8** Add `{{highlight_start}}` template variable — first X words of highlight (configurable)
- [ ] **#10** Add conditional template syntax — e.g. `{{condition|text}}` for optional blocks
- [ ] **#11** Add template file support — use a `template.md` file instead of inline settings

---

## Post-Processing

- [ ] **#24** Collapse extra blank lines — new Post-Processing settings section, strip consecutive blank lines

---

## UI / Polish

- [ ] **#23** Tag autocomplete in settings for shelf/collection tag fields
- [ ] **#25** Standardize setting UI components — audit and consolidate into reusable types
- [ ] **#1** Fix collections item wrapper layout — textbox renders under description instead of anchored right *(aesthetic)*
- [ ] **#31** File location search/autocomplete in settings

---

## Nice-to-Have / Big Lift

- [ ] **#30** Selective import — menu to choose which books to import instead of all

---

## Completed

- [x] **#26** Add `.gitignore` with `node_modules` before submission
- [x] **#27** Add README metadata quality notice (Calibre recommendation)
- [x] **#28** Verify startup time baseline (5–6ms) before submission
- [x] **#29** Verify file size footprint (720KB) before submission
