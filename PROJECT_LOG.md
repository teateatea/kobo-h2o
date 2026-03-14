# PROJECT_LOG — Kobo Highlights 2 Obsidian

## Project Overview

- **Plugin name:** Kobo Highlights 2 Obsidian
- **Plugin ID:** `kobo-highlights-2-obsidian`
- **Description:** Obsidian community plugin that imports highlights from a Kobo e-reader into one note per book. Supports SQLite database, exported text/CSV, and Kobo My Clippings formats.
- **Version:** 1.0.0 (pre-submission)
- **Obsidian min version:** 1.11.0
- **Desktop only:** Yes (uses Node.js `fs` and `path`)
- **Repository:** https://github.com/kobo-h2o/kobo-highlights-2-obsidian
- **Distributable size:** ~720KB (`main.js` 76KB + `sql-wasm.wasm` 644KB + `manifest.json` 0.4KB)
- **Startup time:** ~7ms (measured in Obsidian 1.12.4 with 16 plugins active)

---

## Version History

| Date | Version | Notes |
|------|---------|-------|
| 2026-03-14 | 1.0.0 | Submission-ready baseline. Submission blockers cleared. |

---

## Project Structure

```
kobo-highlights-2-obsidian/
├── src/
│   ├── main.ts          # Plugin entry point, import flows, device detection
│   ├── types.ts         # KoboBook, KoboHighlight interfaces + DEFAULT_SETTINGS
│   ├── renderer.ts      # Note/highlight/frontmatter rendering, template variable substitution
│   ├── sqlite-parser.ts # sql.js SQLite parsing, shelf attachment, chapter cleaning
│   ├── text-parser.ts   # TXT/CSV/Clippings format parsers
│   ├── settings-tab.ts  # Obsidian settings UI (SettingGroup cards, pill vars, template textareas)
│   └── utils.ts         # sanitizeFilename utility
├── main.js              # Built output (esbuild bundle)
├── sql-wasm.wasm        # Bundled sql.js WASM binary
├── manifest.json        # Obsidian plugin manifest
├── package.json         # Node deps (sql.js, obsidian, esbuild, typescript)
├── esbuild.config.mjs   # Build config
├── deploy.mjs           # Dev deploy script (copies built files to vault)
├── setup.bat            # First-run setup script (configures deploy.mjs vault path)
├── tsconfig.json        # TypeScript config
├── .gitignore           # Ignores node_modules/, dist/, *.js.map
├── LICENSE              # MIT
└── README.md            # User-facing docs
```

---

## Technical Architecture

### Data Flow

1. **Import trigger** — user runs a command or clicks ribbon icon
2. **Parse** — SQLite/CSV/TXT parsed into `KoboBook[]` (each with `KoboHighlight[]`)
3. **Filter** — `applyFilters()` drops highlights below `minHighlightWords`
4. **Write** — for each book:
   - If note exists + overwrite off → append new highlights only (deduped by text)
   - If note exists + overwrite on → full replace (after confirmation modal)
   - If note doesn't exist → create with `renderBookNote()`

### Key Files

**`src/types.ts`**
- `KoboHighlight`: text, annotation, chapter, dateCreated, chapterProgress, bookTitle, bookAuthor
- `KoboBook`: title, author, isbn, publisher, language, series, seriesNumber, dateLastRead, percentRead, highlightCount, annotationCount, shelves[], highlights[]
- `KoboImporterSettings`: 7 format cards (Note name, Frontmatter, Note heading, Highlights, Annotations, Footer, Append heading), each with a template string + omitEmptyLines toggle
- `DEFAULT_SETTINGS`: all defaults including full template strings

**`src/renderer.ts`**
- `renderBookNote()` — assembles frontmatter + heading + highlights + footer
- `renderHighlight()` — applies highlight template; appends hardcoded `\n\n---\n` (tasks #5 + #7)
- `renderAppendBlock()` — used for reimport append mode
- `applyVars()` — substitutes `{{var}}` tokens; handles multiline blockquote prefix
- `applyVarsMultiline()` — splits template by line, drops lines where all vars are empty (omitEmptyLines)
- `normaliseHighlightText()` — collapses excessive indentation on continuation lines
- `extractExistingTexts()` — reads first blockquote line of each highlight for dedup

**`src/sqlite-parser.ts`**
- Queries `Bookmark JOIN content` for highlights, with LEFT JOIN on chapter content
- Fetches: Text, Annotation, DateCreated, ChapterProgress, VolumeID, Title, Attribution, ISBN, Publisher, Language, Series, SeriesNumber, DateLastRead, ___PercentRead, chapter Title
- `attachShelves()` — joins ShelfContent + Shelf tables; silently skips on older firmware
- `cleanChapter()` — strips file paths from chapter titles (e.g. `OEBPS/ch03.xhtml` → `ch03`)
- sql.js loaded once per plugin session, cached in `_sqlJsInstance`

**`src/settings-tab.ts`**
- Uses Obsidian `SettingGroup` for card-style layout
- `varRefRow()` — pill-style variable reference row with active highlighting
- `templateTextarea()` / `templateSingleLine()` — full-width template inputs with validation, unknown var warnings, reset button
- `FolderSuggest` — autocomplete for vault folder paths
- Bug fix: one-shot focus listener prevents AbstractInputSuggest from stealing focus on open

**`src/main.ts`**
- `findKoboDevice()` — scans drive letters D-Z on Windows; `/Volumes`, `/media`, `/mnt/media` on Mac/Linux
- `confirmIfOverwrite()` — modal confirmation when Allow Overwrite is on
- Settings migration: `shelvesAsTagsEnabled` → `collectionsAsListEnabled`

### Template Variables

| Context | Variables |
|---------|-----------|
| Note title | `{{title}}`, `{{author}}`, `{{series}}`, `{{series_number}}`, `{{date_last_read}}`, `{{date_imported}}` |
| Frontmatter / heading / footer | Above + `{{percent_read}}`, `{{highlight_count}}`, `{{annotation_count}}`, `{{isbn}}`, `{{publisher}}`, `{{language}}`, `{{collections}}` |
| Highlights | Book vars + `{{highlight_text}}`, `{{chapter}}`, `{{date_highlighted}}`, `{{page_percent}}` |
| Annotations | Book vars + `{{annotation_text}}`, `{{chapter}}`, `{{date_annotated}}`, `{{page_percent}}` |

---

## Build & Deployment

### Prerequisites
- Node.js
- Run `setup.bat` once to configure vault path in `deploy.mjs`

### Commands
```bash
npm install          # Install dependencies
npm run dev          # Watch mode build → deploys to vault on change
npm run build        # Production build
npm run deploy       # One-shot build + copy to vault
```

### Distributable Files
Copy these three files into `<vault>/.obsidian/plugins/kobo-highlights-2-obsidian/`:
- `main.js`
- `manifest.json`
- `sql-wasm.wasm`

---

## Submission Checklist

- [x] `.gitignore` includes `node_modules/`
- [x] Startup time verified: ~7ms
- [x] File size verified: ~720KB
- [x] README metadata quality notice added
- [ ] `manifest.json` author field needs real name/handle before submission

---

## Known Issues & Next Work

See task list. Next session begins at:
- **#7** Make heading dividers user-configurable (`renderer.ts:120` hardcoded `---`)
- **#5** Add highlight spacing setting (`renderer.ts:120` hardcoded `\n\n`)

These touch the same line and should be implemented together.

---

## Rebuild Instructions

1. `git clone https://github.com/kobo-h2o/kobo-highlights-2-obsidian`
2. `cd kobo-highlights-2-obsidian && npm install`
3. Run `setup.bat` and enter your vault path when prompted
4. `npm run deploy` to build and install to your vault
5. Enable plugin in Obsidian → Settings → Community plugins
