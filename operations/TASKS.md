# Kobo-H2O Task Backlog

Persistent cross-session task list. Update status inline: `[ ]` pending, `[x]` done, `[~]` in progress.

---

## Author / Metadata Formatting

- [ ] **#92** Date format preview renders to right of input, not below
  [D:15 C:55] The preview text appears to the right of the input field instead of on its own line below it; fix layout so both elements stack vertically, and remove the "Preview:" label prefix.
  Original: Date format preview layout fix: preview renders to the RIGHT of the input instead of below it. Fix layout so text box and preview each occupy their own line, both anchored right. Also remove the "Preview:" prefix label -- show just the formatted date string.
  Context: pre-existing task

- [ ] **#105** Clarify wrapper setting applies per-item, not to whole list
  [D:10 C:55] Update the Collection items / author name wrapper description to explain that wrappers are applied individually per item (e.g. each author wrapped separately), distinguishing it from putting `[[` and `]]` directly in a template which wraps the whole list.
  Original: Wrapper settings (Collection items, author name): improve description to clarify that wrappers apply per-item in a list -- e.g. each author gets wrapped individually. This distinguishes the setting from putting `[[` and `]]` directly in a template, which wraps the whole list rather than each item.
  Context: pre-existing task

- [ ] **#107** Add case transformation setting for author names
  [D:55 C:50] Add a setting similar to the existing Title case format for `{{title}}` that allows author names to be output in ALL CAPS, Title Case, etc.
  Original: Consider adding a case transformation setting for author names (similar to the existing Title case format setting for `{{title}}`) -- e.g. allow users to output authors in ALL CAPS, Title Case, etc.
  Context: pre-existing task

- [ ] **#113** Change date format default to show more format tokens in preview
  [D:10 C:60] Change the default value of the date format setting from its current pattern to `YYYY-MM-DDThh:mm:ss` so more format tokens are visible in the live preview by default.
  Original: Date format setting: change the default value from its current pattern to `YYYY-MM-DDThh:mm:ss` so more tags are shown in the preview by default
  Context: pre-existing task

---

## Chapter Title Cleanup *(batch together)*

- [ ] **#42** ~~Add Chapter Case setting~~ (covered by #21)
  [D:10 C:55] This was de-scoped as it is covered by the Title case formatting options in task #21; likely just needs to be marked done.
  Original: ~~Add Chapter Case setting~~ -- covered by #21 (Title case formatting options)
  Context: pre-existing task

- [ ] **#62** Re-check chapter prefix capitalization after #21
  [D:15 C:45] The "Standardize chapter prefix" dropdown option text may need capitalization adjustments once #21 (Title Case formatting) is fully implemented; review and align.
  Original: "Standardize chapter prefix" dropdown options -- re-check capitalization once #21 (Title Case formatting) is complete
  Context: pre-existing task

---

## Template / Power-User Features

- [ ] **#3** Investigate whether highlight time-of-day is stored in SQLite
  [D:40 C:45] Check the Kobo SQLite database schema to determine if the time component of a highlight's timestamp is stored; if so, expose it as a template variable.
  Original: Investigate highlight time storage in SQLite -- check if time-of-day is stored, expose it if so
  Context: pre-existing task

- [ ] **#8** Add `{{highlight_start}}` template variable
  [D:50 C:55] Add a new template variable that outputs the first X words of a highlight, where X is user-configurable.
  Original: Add `{{highlight_start}}` template variable -- first X words of highlight (configurable)
  Context: pre-existing task

- [ ] **#11** Add template file support
  [D:75 C:50] Allow users to store their import template in a `template.md` file in their vault instead of using the inline settings text box.
  Original: Add template file support -- use a `template.md` file instead of inline settings
  Context: pre-existing task

- [ ] **#118** Add inline case modifiers for template tags
  [D:65 C:55] Support case modifier syntax on template tags: e.g. `{{Author#titlecase}}`, `{{AUTHOR#allcaps}}`, `{{author#lowercase}}`; should work with most available tags.
  Original: Inline case modifiers for template tags -- e.g. `{{author}}` (no change), `{{Author#titlecase}}` (Title Case), `{{AUTHOR#allcaps}}` (ALL CAPS), `{{author#lowercase}}` (lowercase); should work with most tags
  Context: pre-existing task

- [ ] **#128** Decide when to show conditional syntax hint
  [D:20 C:50] The conditional syntax hint (added in #61) currently always shows; decide on a display policy -- e.g. only when `{{X|Y}}` is present in the template, or always.
  Original: Conditional syntax hint (#61) shows always -- decide when to show it (e.g. only when `{{X|Y}}` is present in the template, or always). Currently always visible.
  Context: pre-existing task; was erroneously assigned #62 (duplicate of the chapter prefix task), renumbered to #128

---

## Post-Processing

- [ ] **#24** Add post-processing setting to collapse consecutive blank lines
  [D:45 C:55] Add a new Post-Processing settings section with a toggle to strip consecutive blank lines from the generated output.
  Original: Collapse extra blank lines -- new Post-Processing settings section, strip consecutive blank lines
  Context: pre-existing task

- [ ] **#116** Define behavior for trailing blank lines at end of template
  [D:20 C:45] Decide and implement a policy for templates that end with trailing blank lines: should those blank lines appear in the output, or be culled?
  Original: Templates that end in trailing blank lines -- should those blank lines be culled from the output, or preserved as the user wrote them?
  Context: pre-existing task

---

## Settings Restructure / Advanced Formatting Section

- [ ] **#79** Add visual affordance to Advanced Formatting collapsible headings
  [D:15 C:55] Add a `>` prefix and border outline to Advanced Formatting section headings to visually distinguish them from regular section headings.
  Original: Advanced Formatting collapsible headings: add visual affordance -- `>` prefix and border outline to distinguish from regular section headings
  Context: pre-existing task

- [ ] **#80** Pre-submission review: confirm final settings organization
  [D:30 C:40] Before submitting to the Obsidian community plugin registry, do a final pass to confirm all settings are organized in the most appropriate sections.
  Original: Pre-submission review: confirm all final settings are organized appropriately
  Context: pre-existing task

---

## UI / Polish

- [ ] **#1** Fix collections item wrapper layout *(implemented)*
  [D:15 C:55] The textbox for the collections item wrapper renders under the description instead of anchored to the right; fix the layout to align it correctly.
  Original: Fix collections item wrapper layout -- textbox renders under description instead of anchored right *(aesthetic)*
  Context: pre-existing task

- [ ] **#23** Tag autocomplete in settings for shelf/collection tag fields
  [D:65 C:40] Add autocomplete suggestions for Obsidian tags in the shelf/collection tag input fields in settings.
  Original: Tag autocomplete in settings for shelf/collection tag fields
  Context: pre-existing task

- [ ] **#25** Standardize setting UI components across the plugin
  [D:60 C:35] Audit all custom setting UI components and consolidate them into a set of reusable, consistent types.
  Original: Standardize setting UI components -- audit and consolidate into reusable types
  Context: pre-existing task

- [ ] **#31** Add file location search/autocomplete in settings
  [D:65 C:40] Add search or autocomplete functionality to file location input fields in settings.
  Original: File location search/autocomplete in settings
  Context: pre-existing task

- [ ] **#84** Improve book row layout in book selection modal
  [D:25 C:55] Restyle the book selection modal rows so title + author appear in a slightly larger font and highlight count appears on a new line in gray text.
  Original: Book selection modal: improve book row layout -- title + author in slightly larger font, highlight count on a new line in gray text
  Context: pre-existing task

- [ ] **#96** Show plugin version number visibly in settings
  [D:15 C:60] Display the plugin version number somewhere visible in the settings panel so the correct version can be confirmed after `npm run` without opening package.json.
  Original: Show plugin version number visibly in settings -- so the correct version can be confirmed after `npm run` without opening package.json
  Context: pre-existing task

- [ ] **#97** Change "Allow overwrite" toggle to a "Reimport behaviour" dropdown
  [D:35 C:55] Replace the Allow overwrite toggle with a dropdown labeled "Reimport behaviour" with options "Append" (default) and "OVERWRITE"; keep the overwrite warning logic; description should explain data loss risk.
  Original: Change "Allow overwrite" toggle to a dropdown. Label: "Reimport behaviour". Description: "Append: All edits in existing notes are preserved, and new highlights are added to the end.\nOverwrite: Existing notes are fully replaced on every import. Data could be lost!" Options: "Append" (default) and "OVERWRITE". Warning still appears when OVERWRITE is selected -- no visual change to warning logic.
  Context: pre-existing task

- [ ] **#98** Persist book selection default state from Select all / Select none buttons
  [D:45 C:55] When the user clicks "Select all" or "Select none" in the book selection modal, save that as the default state for next time the modal opens; individual book check/uncheck should not affect the saved default.
  Original: Book selection modal: persist the default selection state when "Select all" or "Select none" buttons are clicked. If the user clicks "Select none", open with none selected next time. If the user clicks "Select all", open with all selected next time. This only triggers from the buttons -- manually checking/unchecking individual books does not affect the saved default.
  Context: pre-existing task

- [ ] **#99** Use Windows volume label instead of drive letter in device name notice
  [D:35 C:50] Replace the drive letter (e.g. "F:") with the volume label (e.g. "KOBOeREADER") when displaying the "[DEVICE-NAME] found!" notice.
  Original: Device name notice: use Windows volume label (e.g. "KOBOeREADER") instead of drive letter (e.g. "F:") when showing "[DEVICE-NAME] found!"
  Context: pre-existing task

- [ ] **#100** Reduce second device notice delay from 500ms to 100ms
  [D:10 C:60] Change the delay before showing the second device detection notice from 500ms to 100ms.
  Original: Device name notice: reduce second notice delay from 500ms to 100ms
  Context: pre-existing task

- [ ] **#101** Show two sequential notices for "Kobo device not found" path
  [D:15 C:55] Replace the single "Kobo device not found" notice with two sequential notices matching the pattern used for the device-found flow.
  Original: "Kobo device not found" path: replace single notice with two sequential notices matching the pattern of the found flow
  Context: pre-existing task

- [ ] **#114** Remove the "General" settings section header
  [D:10 C:60] Remove the top-level "General" section heading from the settings panel to match Obsidian plugin conventions.
  Original: Remove the "General" settings header -- Obsidian plugin conventions prefer jumping straight into settings without a top-level section header.
  Context: pre-existing task

- [ ] **#115** Hide highlight/annotation counts in book modal when import is toggled off
  [D:45 C:55] When "Import highlights" is off, hide highlight count from book rows; when on, show it. Same logic for annotations. When both are on, show combined count format e.g. "(130 highlights, 9 annotations)".
  Original: Book selection modal: when "Import highlights" is toggled off, hide highlight count from book rows (e.g. no "(130 highlights)"). When toggled on, show highlights. Same logic for "Import annotations" -- when off, hide annotation count; when on, show it. When both are on, show combined "(130 highlights, 9 annotations)".
  Context: pre-existing task

- [ ] **#117** Show import source (device or filename) in book selection modal
  [D:40 C:50] Display the source being imported from -- either the Kobo device name or the filename -- in the book selection modal so the user knows what they're importing.
  Original: Book selection modal: show the source being imported from -- either the Kobo device name or the filename -- so the user knows what they're importing
  Context: pre-existing task

- [ ] **#119** Add setting to suppress overwrite confirmation prompt
  [D:35 C:55] Add a setting for users who have intentionally chosen OVERWRITE mode to suppress the confirmation prompt that appears on each import.
  Original: Add a setting to suppress the overwrite warning -- for users who have intentionally chosen OVERWRITE mode and don't want the confirmation prompt each time
  Context: pre-existing task

---

## Import / File Handling

- [x] **#89** Revisit illegal characters in note names -- there may be additional characters that should be stripped/replaced. Windows illegal chars are `< > : / \ | ? * "` plus `[` and `]`. This list may differ per OS; consider making it OS-aware or using the broadest safe set. *(implemented)* *(verified)*

- [ ] **#56** Combine SQLite and text/CSV import into unified "Import from file" flow
  [D:65 C:50] Merge the "Import from SQLite file" and "Import from text/CSV export" flows into a single "Import from file" entry point that auto-detects the file type.
  Original: Combine "Import from SQLite file" and "Import from text/CSV export" into a single "Import from file" flow -- auto-detect file type
  Context: pre-existing task

- [ ] **#75** New import path: Calibre export files
  [D:70 C:40] Add support for importing highlights from Calibre export files.
  Original: New import path: Calibre export files
  Context: pre-existing task

- [ ] **#76** New import path: Kobo cloud export (pdf, html, txt, md)
  [D:70 C:40] Add support for importing highlights from Kobo cloud exports in various formats (pdf, html, txt, md).
  Original: New import path: Kobo cloud export (pdf, html, txt, md)
  Context: pre-existing task

- [ ] **#77** Investigate Kobo to Google Drive import feasibility
  [D:50 C:25] Research whether a Kobo -> Google Drive import path is feasible; assess API/OAuth requirements and data availability.
  Original: New import path: Kobo -> Google Drive (investigate feasibility)
  Context: pre-existing task

---

## Setup / Onboarding

- [ ] **#124** Restyle setup.bat with colors and rename to SETUP.bat
  [D:25 C:55] Rename setup.bat to SETUP.bat; add color styling: header and step headings in green, ERROR messages in orange, user instructions in yellow, "Done!" bar renamed to "Success!" and styled all green, next steps section in yellow.
  Original: Restyle setup.bat with colours and rename to SETUP.bat -- header bar "Kobo Highlights-2-Obsidian | Setup": all green; step headings: green; ERROR: messages: orange; user instructions (e.g. "Download and install Node.js", "Enter the full path to your Obsidian vault"): yellow; "Done!" bar: rename to "Success!" and make all green; next steps section: yellow
  Context: pre-existing task

- [ ] **#125** Improve "No highlights found" error with specific sub-cases
  [D:25 C:55] Show context-specific messages: if the SQLite file is not named KoboReader.sqlite, show the actual filename and prompt to select the correct file; if it is correctly named but has zero highlights, say so explicitly.
  Original: Improve "No highlights found" error with specific sub-cases -- (a) if .sqlite file is not named exactly "KoboReader.sqlite": show "File selected: [name]" and "Please select your KoboReader.sqlite file."; (b) if file IS named "KoboReader.sqlite" but has zero highlights: show "There are 0 books with highlights here!"
  Context: pre-existing task

---

## Submission / Review

- [ ] **#57** Trial run of new user onboarding process
  [D:30 C:35] Review and do a walkthrough of the new user onboarding process before Obsidian plugin approval; identify gaps or friction points.
  Original: Review the new user onboarding process (pre-approval) trial run and walkthrough
  Context: pre-existing task

- [ ] **#58** Determine if Apple computers require alternative handling
  [D:45 C:30] Investigate whether macOS requires any alternative behavior for device detection, file paths, or other platform-specific logic.
  Original: Do Apple computers require alternative handling?
  Context: pre-existing task

- [ ] **#126** Set up GitHub wiki for features and settings documentation
  [D:60 C:45] Create and populate a GitHub wiki covering plugin features and settings for end-user reference.
  Original: Set up GitHub wiki for features and settings documentation
  Context: pre-existing task

---

## Testing Infrastructure

- [ ] **#59** Add jest or vitest test framework
  [D:60 C:55] Configure a test runner (jest or vitest) in the project; no test runner currently exists and it is needed before automated tests can be written for helpers like `koboColorName()` and `queryBooks()`.
  Original: Add test framework (jest or vitest) -- no test runner currently configured; needed before automated tests can be written for helpers like `koboColorName()` and `queryBooks()`
  Context: pre-existing task

- [ ] **#86** Verify text/CSV import shows book selection modal
  [D:20 C:55] Test 5 was skipped during #30 verification because no .txt or .csv file was available; manually verify the book selection modal appears for text/CSV imports.
  Original: Verify text/CSV import shows selection modal (test 5 skipped during #30 verification -- needs a .txt or .csv file)
  Context: pre-existing task

- [ ] **#106** Safety audit: verify Kobo device cannot be corrupted by plugin
  [D:50 C:50] In-depth review to confirm the physical Kobo cannot be corrupted by plugin behavior even under adversarial usage; review all read/write paths touching device filesystem and SQLite DB; verify read-only access only; check for edge cases that could interrupt file operations.
  Original: Safety audit: in-depth review and research to confirm the physical Kobo device cannot be corrupted or damaged by plugin behavior, even under adversarial usage (e.g. rapid repeated reimports). Review all read/write paths touching the device filesystem and SQLite DB; verify read-only access only; check for edge cases that could interrupt a file operation mid-write.
  Context: pre-existing task

---

## Completed

- [x] **#2** Configurable date format options -- date format should include highlighted time as well as date *(implemented)*
- [x] **#4** Add highlight numbering (#1, #2, #3... per book)
- [x] **#5** Add highlight spacing setting -- single or double spacing between highlights
- [x] **#6** Add sort order option -- sort highlights by date or by page position (ChapterProgress %)
- [x] **#7** Make heading dividers user-configurable -- remove hardcoded `---`, move to default template
- [x] **#9** Restore highlight colour tagging *(was previously working, now broken)*
- [x] **#10** Add conditional template syntax -- e.g. `{{condition|text}}` for optional blocks
- [x] **#12** Add note creation date as a frontmatter field
- [x] **#13** Normalize author separator -- convert `;` to `,` between multiple authors
- [x] **#14** Author name order option -- convert `Last, First` -> `First Last` and/or reverse *(implemented)*
- [x] **#15** Author name wrappers setting -- e.g. `[[First Last]]` per author *(implemented)*
- [x] **#16** Chapter title formatting -- add space between letters/numbers, apply title case
- [x] **#17** Strip leading zeros from chapter numbers
- [x] **#18** Trim X words from start and/or end of chapter titles
- [x] **#19** Normalize `ch` / `chapter` prefix variants
- [x] **#20** Symbol normalization -- replace uncommon symbols (e.g. `;` -> `-`)
- [x] **#21** Title case formatting options -- Title_Case, ALL CAPS, etc. *(implemented)*
- [x] **#22** Percent format options -- `0.5`, `50`, `50%`, `50PCT`, upper/lower variants *(implemented)*
- [x] **#26** Add `.gitignore` with `node_modules` before submission
- [x] **#27** Add README metadata quality notice (Calibre recommendation)
- [x] **#28** Verify startup time baseline (5-6ms) before submission
- [x] **#29** Verify file size footprint (720KB) before submission
- [x] **#30** Selective import -- menu to choose which books to import instead of all *(implemented)* *(verified)*
- [x] **#32** Visual bug: unknown variable warning fires on conditional template syntax tokens (e.g. `{{series|1}}`) *(implemented)* *(verified)*
- [x] **#33** Move "Skip single-word highlights" setting into the Highlights section *(implemented)* *(verified)*
- [x] **#34** Create Advanced Formatting section at bottom of settings; move Chapter Title settings group into it *(implemented)* *(verified)*
- [x] **#35** All Advanced Formatting setting groups should be collapsible dropdowns -- remember open/close state until Obsidian closes, default closed *(implemented)* *(verified)*
- [x] **#36** Rename setting: "Add letter/number spacing" -> "Add spaces between letters and numbers" *(implemented)* *(verified)*
- [x] **#37** Update letter/number spacing description to: "Insert spaces at letter<->digit boundaries (e.g. ch5Intro -> ch 5 Intro)" *(implemented)* *(verified)*
- [x] **#38** Trim words from start/end: show grayed-out `0` when empty, treat empty as 0 *(implemented)* *(verified)*
- [x] **#39** Trim words from start description: "Remove first N words from the chapter title (e.g. A Lopsided Arms Race -> Arms Race)" *(implemented)* *(verified)*
- [x] **#40** Trim words from end description: "Remove last N words from the chapter title (e.g. A Lopsided Arms Race -> A Lopsided)" *(implemented)* *(verified)*
- [x] **#41** Rename "Chapter prefix" -> "Standardize chapter prefix"; description: "Normalize 'ch' & 'chapter' prefixes (e.g. lotr ch 2 -> lotr chapter 2)" *(implemented)* *(verified)*
- [x] **#43** Symbols to replace: show `e.g. ;,-` as placeholder text when empty *(implemented)* *(verified)*
- [x] **#44** When Symbols to replace is empty, gray out the "Replace with" setting *(implemented)* *(verified)*
- [x] **#45** Replace with: show grayed-out `(delete)` placeholder when empty *(implemented)* *(verified)*
- [x] **#46** Move Collections item wrapper into Advanced Formatting under a "Collections" group; update placeholder text to `e.g. [[##]], ` *(implemented)* *(verified)*
- [x] **#47** "No highlights found" section: remove the dog-ears line *(implemented)* *(verified)*
- [x] **#48** Troubleshooting: remove the "sql-wasm.wasm not found" section entirely *(implemented)* *(verified)*
- [x] **#49** "Device not detected automatically": add as first bullet "Confirm that your device is connected. Some cables don't support data (only charging)." *(implemented)* *(verified)*
- [x] **#50** Privacy section: last sentence should read "No internet connection is needed, after installation." *(implemented)* *(verified)*
- [x] **#51** Features: change import methods line to "Import methods: Direct from USB device, SQLite file, text file, or CSV file." *(implemented)* *(verified)*
- [x] **#52** Features: add bullet "Configurable import format: customize your import template" *(implemented)* *(verified)*
- [x] **#53** Features: remove "shelves as tags", "chapter context", and "reading dashboard" bullets *(implemented)* *(verified)*
- [x] **#54** Features: update "One note per book" bullet to clarify all possible metadata included *(implemented)* *(verified)*
- [x] **#55** Features: remove "Smart reimport" bullet (feature doesn't exist yet) *(implemented)* *(verified)*
- [x] **#60** Add a color mapping setting: allow each possible `{{highlight_color}}` output (yellow, red, blue, green) to be replaced with a custom string, so e.g. `> [!{{highlight_color}}]` can render as `> [!quote]` instead of `> [!yellow]`. *(implemented)* *(verified)*
- [x] **#61** Add hint text near template fields explaining conditional syntax -- `{{series|1}}` activates group 1 when series is non-empty; `{{1|some text}}` is the matching text block for group 1 *(implemented)* *(verified)*
- [x] **#63** Skills consistency audit -- all skills need `Skill` in their `allowed-tools`, and all skills should use `AskUserQuestion` to offer a `/clear` + next-skill prompt at the end of their flow
- [x] **#64** implement-plan skill: update progress as steps complete, not all at the end -- revisit skill implementation
- [x] **#65** implement-plan skill: remind user to reset Obsidian settings after implementation
- [x] **#66** README build-from-source section: git clone address is wrong -- verify and fix
- [x] **#67** verify-plan skill: for documentation-only plans, auto-check expected strings in files instead of prompting the user to look manually *(implemented)* *(verified)*
- [x] **#68** Add Worktree skill -- enable simultaneous agent instances via git worktrees *(implemented)* *(verified)*
- [x] **#69** Date format setting: show a live-updating example of how the user's format string renders the current date/time *(implemented)* *(verified)*
- [x] **#70** Date format setting: make the momentjs.com reference a clickable hyperlink *(implemented)* *(verified)*
- [x] **#71** Author name order dropdown: revise options to "First Last", "Last, First", "Don't change order" (default: Don't change order) *(implemented)* *(verified)*
- [x] **#72** Author name wrapper: exclude wrapper from note name and frontmatter -- only apply in body templates *(implemented)* *(verified)*
- [x] **#73** Confirm scope of Title case format setting -- should it apply only to `{{title}}` or also affect author? Confirm it should not affect author name. *(implemented)* *(verified)*
- [x] **#74** "My Words" section in incoming data -- Kobo may include dictionary lookup saves; revisit import details and check single-word import handling *(implemented)* *(verified)*
- [x] **#78** Infrastructure bug: investigate erroneous VERIFIED renames in the pipeline -- fixed: `/review-plan` now renames to `APPROVED-*` on user approval; `/verify-plan` renames to `VERIFIED-*` (stripping `APPROVED-` prefix) after post-implementation verification *(implemented)*
- [x] **#81** Date format description: rewrite to "Format string for all date fields. [See Moment.js for details.](https://momentjs.com/docs/#/displaying/format/)" *(implemented)* *(verified)*
- [x] **#82** Date format preview: move preview to display directly below the text box (currently appears in description, visually far from input) *(implemented)* *(verified)*
- [x] **#85** Bug: "File already exists" on reimport when title case setting changes -- root cause: Windows case-insensitive filesystem + Obsidian case-sensitive vault index. Old note exists as `MY BOOK.md`; new title case produces `My Book.md`; `getAbstractFileByPath` returns null (only knows the old casing), so `vault.create` is called and Windows rejects it. Fix: case-insensitive file lookup before calling `vault.create` (e.g. scan vault files for matching path ignoring case). *(implemented)* *(verified)*
- [x] **#87** Fix status message sequencing -- "Found Kobo - importing..." fires after overwrite confirmation but before book selection. Should show "Kobo found!" immediately when the command runs (before any modal), then show an import/progress message only when actually writing data. *(implemented)* *(verified)*
- [x] **#88** When overwrite is ON and title case setting changes, rename existing note to match new title casing on reimport. Currently noted as out of scope in fix-case-reimport.md, but unintuitive when overwrite is enabled. *(worktree closed)* *(implemented)* *(verified)*
- [x] **#90** On device detection, show two sequential notices: "Kobo device detected." (7000ms), then "[DEVICE-NAME] found!" (9000ms). Device name derived from mount/drive path (e.g. "KOBOeReader" on macOS, drive letter on Windows). *(implemented)* *(verified)*
- [x] **#91** Create a `/add-task` skill -- reads TASKS.md, picks the next task number, appends the new task to the appropriate section, and confirms placement. *(important)* *(implemented)* *(verified)*
- [x] **#108** *[high priority]* implement-worktree-team: stale `main.js` after parallel worktree merges *(implemented)* *(verified)* -- when two worktrees are built in parallel, each `main.js` is compiled from that branch's source only. The second worktree to merge wins the rebase conflict, overwriting the first worktree's changes in the built artifact even though the TypeScript source merges correctly. Requires a clean rebuild from main after all worktrees are merged. Fix: either (a) don't commit `main.js` in worktrees at all -- rebuild once from main after all merges, or (b) implement-worktree-team should run `npm run build` on main after the final merge and commit the result.
- [x] **#111** New skill: "parallel-plan-team" *(worktree closed)* (or similar) -- runs `/plan-review-team` for multiple tasks in parallel, one subagent per task, then presents all resulting plans for user approval. *(implemented)* *(verified)*
- [x] **#95** verify-plan skill: `npm run deploy` consistently fails in worktrees *(implemented)* *(verified)*
- [x] **#104** `npm run deploy` fails in worktrees with "tsc not found" *(implemented)* *(verified)*
- [x] **#121** *[important]* /add-task skill: update task save format to `[#tasknumber] [difficulty-rating-for-Claude] [Claude's interpretation of the task] ([user's exact words], [brief situation summary])` -- preserves both Claude's understanding and the verbatim request, plus a difficulty rating, so context is fully captured for future reference. *(implemented)* *(verified)*
