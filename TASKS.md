# Kobo-H2O Task Backlog

Persistent cross-session task list. Update status inline: `[ ]` pending, `[x]` done, `[~]` in progress.

---

## Bugs / Regressions

- [x] **#9** Restore highlight colour tagging *(was previously working, now broken)*

---

## Quick Wins / High Value

- [x] **#13** Normalize author separator — convert `;` to `,` between multiple authors
- [x] **#7** Make heading dividers user-configurable — remove hardcoded `---`, move to default template
- [x] **#12** Add note creation date as a frontmatter field
- [x] **#4** Add highlight numbering (#1, #2, #3… per book)
- [x] **#5** Add highlight spacing setting — single or double spacing between highlights
- [x] **#6** Add sort order option — sort highlights by date or by page position (ChapterProgress %)

---

## Author / Metadata Formatting

- [ ] **#14** Author name order option — convert `Last, First` → `First Last` and/or reverse
- [ ] **#15** Author name wrappers setting — e.g. `[[First Last]]` per author
- [ ] **#2** Configurable date format options — date format should include highlighted time as well as date
- [ ] **#21** Title case formatting options — Title_Case, ALL CAPS, etc.
- [ ] **#22** Percent format options — `0.5`, `50`, `50%`, `50PCT`, upper/lower variants

---

## Chapter Title Cleanup *(batch together)*

- [x] **#16** Chapter title formatting — add space between letters/numbers, apply title case
- [x] **#17** Strip leading zeros from chapter numbers
- [x] **#18** Trim X words from start and/or end of chapter titles
- [x] **#19** Normalize `ch` / `chapter` prefix variants
- [x] **#20** Symbol normalization — replace uncommon symbols (e.g. `;` → `-`)
- [ ] **#36** Rename setting: "Add letter/number spacing" -> "Add spaces between letters and numbers"
- [ ] **#37** Update letter/number spacing description to: "Insert spaces at letter<->digit boundaries (e.g. ch5Intro -> ch 5 Intro)"
- [ ] **#38** Trim words from start/end: show grayed-out `0` when empty, treat empty as 0
- [ ] **#39** Trim words from start description: "Remove first N words from the chapter title (e.g. A Lopsided Arms Race -> Arms Race)"
- [ ] **#40** Trim words from end description: "Remove last N words from the chapter title (e.g. A Lopsided Arms Race -> A Lopsided)"
- [ ] **#41** Rename "Chapter prefix" -> "Standardize chapter prefix"; description: "Normalize 'ch' & 'chapter' prefixes (e.g. lotr ch 2 -> lotr chapter 2)"
- [ ] **#42** Add Chapter Case setting — options: No change, UPPER CASE, lower case, Title Case; description with example (e.g. part 2 chapter 28 -> Part 2 Chapter 28)

---

## Highlight Color / Callout

- [ ] **#60** Add a setting to auto-convert `{{highlight_color}}` into Obsidian callout syntax — e.g. wrap highlight block as `> [!yellow]` based on Kobo color value

---

## Template / Power-User Features

- [ ] **#3** Investigate highlight time storage in SQLite — check if time-of-day is stored, expose it if so
- [ ] **#8** Add `{{highlight_start}}` template variable — first X words of highlight (configurable)
- [x] **#10** Add conditional template syntax — e.g. `{{condition|text}}` for optional blocks
- [ ] **#11** Add template file support — use a `template.md` file instead of inline settings
- [ ] **#32** Visual bug: unknown variable warning fires on conditional template syntax tokens (e.g. `{{series|1}}`)

---

## Post-Processing

- [ ] **#24** Collapse extra blank lines — new Post-Processing settings section, strip consecutive blank lines

---

## Settings Restructure / Advanced Formatting Section

- [ ] **#33** Move "Skip single-word highlights" setting into the Highlights section
- [ ] **#34** Create Advanced Formatting section at bottom of settings; move Chapter Title settings group into it
- [ ] **#35** All Advanced Formatting setting groups should be collapsible dropdowns — remember open/close state until Obsidian closes, default closed
- [ ] **#46** Move Collections item wrapper into Advanced Formatting under a "Collections" group; update placeholder text to `e.g. [[##]], `

---

## UI / Polish

- [ ] **#23** Tag autocomplete in settings for shelf/collection tag fields
- [ ] **#25** Standardize setting UI components — audit and consolidate into reusable types
- [ ] **#1** Fix collections item wrapper layout — textbox renders under description instead of anchored right *(aesthetic)*
- [ ] **#31** File location search/autocomplete in settings
- [ ] **#43** Symbols to replace: show `e.g. ;,-` as placeholder text when empty
- [ ] **#44** When Symbols to replace is empty, gray out the "Replace with" setting
- [ ] **#45** Replace with: show grayed-out `(delete)` placeholder when empty

---

## README Edits

- [ ] **#47** "No highlights found" section: remove the dog-ears line
- [ ] **#48** Troubleshooting: remove the "sql-wasm.wasm not found" section entirely
- [ ] **#49** "Device not detected automatically": add as first bullet "Confirm that your device is connected. Some cables don't support data (only charging)."
- [ ] **#50** Privacy section: last sentence should read "No internet connection is needed, after installation."
- [ ] **#51** Features: change import methods line to "Import methods: Direct from USB device, SQLite file, text file, or CSV file."
- [ ] **#52** Features: add bullet "Configurable import format: customize your import template"
- [ ] **#53** Features: remove "shelves as tags", "chapter context", and "reading dashboard" bullets
- [ ] **#54** Features: update "One note per book" bullet to clarify all possible metadata included
- [ ] **#55** Features: remove "Smart reimport" bullet (feature doesn't exist yet)

---

## Import / File Handling

- [ ] **#56** Combine "Import from SQLite file" and "Import from text/CSV export" into a single "Import from file" flow — auto-detect file type

---

## Submission / Review

- [ ] **#57** Review the new user onboarding process (pre-approval) trial run and walkthrough
- [ ] **#58** Do Apple computers require alternative handling?

---

## Testing Infrastructure

- [ ] **#59** Add test framework (jest or vitest) — no test runner currently configured; needed before automated tests can be written for helpers like `koboColorName()` and `queryBooks()`

---

## Nice-to-Have / Big Lift

- [ ] **#30** Selective import — menu to choose which books to import instead of all

---

## Completed

- [x] **#26** Add `.gitignore` with `node_modules` before submission
- [x] **#27** Add README metadata quality notice (Calibre recommendation)
- [x] **#28** Verify startup time baseline (5–6ms) before submission
- [x] **#29** Verify file size footprint (720KB) before submission
- [x] **#4** Add highlight numbering (#1, #2, #3… per book)
- [x] **#6** Add sort order option — sort highlights by date or by page position (ChapterProgress %)
- [x] **#12** Add note creation date (`{{date_note_created}}`) as a frontmatter field
- [x] **#13** Normalize author separator — convert `;` to `,` between multiple authors
