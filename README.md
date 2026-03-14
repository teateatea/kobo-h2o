# Kobo Highlights 2 Obsidian

Import highlights from your Kobo e-reader directly into Obsidian. One note per book, with metadata, chapter context, and configurable formatting.

---

## Features

- **Three import methods**: USB auto-scan, manual SQLite file picker, or text/CSV export
- **One note per book** — title, author, series, and YAML frontmatter included
- **Chapter context** — each highlight shows its chapter and date
- **Smart reimport** — new highlights are appended; your edits are never overwritten
- **Color callouts** — map Kobo highlight colors (yellow/red/blue/green) to Obsidian callout types
- **Shelves as tags** — import your Kobo collections as frontmatter tags
- **Reading dashboard** — optional summary note listing all imported books
- **Fully offline** — SQLite parsing uses a bundled WASM binary; no internet required

---

## Installation

### From Community Plugins (recommended)

1. Open **Settings → Community plugins → Browse**
2. Search for **Kobo Highlights 2 Obsidian**
3. Click **Install**, then **Enable**

### Manual Installation

1. Download the latest release from GitHub Releases
2. Extract `main.js`, `manifest.json`, and `sql-wasm.wasm` into your vault's plugin folder:
   ```
   <vault>/.obsidian/plugins/kobo-highlights-2-obsidian/
   ```
3. Open **Settings → Community plugins** and enable the plugin

### Build from Source

```bash
git clone https://github.com/kobo-h2o/kobo-highlights-2-obsidian
cd kobo-highlights-2-obsidian
npm install
```

Edit `deploy.mjs` to set your vault path, then:

```bash
npm run deploy
```

---

## Usage

### Importing highlights

Open the command palette (`Cmd/Ctrl+P`) and run one of:

| Command | When to use |
|---------|-------------|
| **Import from Kobo device** | Connect via USB — the plugin scans drive letters and `/Volumes` automatically |
| **Import from SQLite file** | Manually locate `KoboReader.sqlite` (inside the `.kobo` folder on your device) |
| **Import from text/CSV export** | Use a highlights file exported from your Kobo or a third-party tool |

You can also click the **book icon** in the left ribbon to choose an import method.

### Reimporting

By default the plugin is **append-only**: new highlights are added under a `## New Highlights (date)` heading, and existing content is never touched. Enable **Allow Overwrite** in settings if you want full note replacement instead.

---

## Output Format

Each book gets its own note. Example with default settings:

```markdown
---
title: "Dune Messiah"
author: "Frank Herbert"
series: "Dune Chronicles"
percent_read: 100
highlight_count: 42
imported: "2025-01-15"
tags:
  - "kobo"
  - "highlights"
---

# Dune Messiah
*by Frank Herbert*
*Dune Chronicles*

42 highlights — imported 2025-01-15

---

## Highlights

> The person who experiences greatness must have a feeling for the myth he is in.

chapter 05 · 2025-01-10

---

> Empires do not suffer emptiness of purpose at the time of their creation.

chapter 08 · 2025-01-11

---
```

---

## Settings

### Output

| Setting | Default | Description |
|---------|---------|-------------|
| Output folder | `Kobo Highlights` | Folder where book notes are created |
| Note title template | `{{title}} ({{author}})` | Variables: `{{title}}`, `{{author}}`, `{{series}}`, `{{date}}` |
| Add frontmatter | On | YAML frontmatter with title, author, and import metadata |

### Filtering

| Setting | Default | Description |
|---------|---------|-------------|
| Minimum highlight length | `0` | Skip highlights shorter than N words. `0` = import everything. `2+` filters single-word dictionary lookups. |

### Highlight Format

| Setting | Default | Description |
|---------|---------|-------------|
| Quote format | Blockquote | Render highlights as `> blockquote` or plain text |
| Metadata template | `{{chapter}} · {{date}}` | Line shown with each highlight. Variables: `{{chapter}}`, `{{date}}`, `{{progress}}`, `{{title}}`, `{{author}}` |
| Metadata position | Below | Show metadata above or below the highlight |
| Show annotations | On | Include notes you typed on your Kobo |
| Annotation template | `**Note:** {{annotation}}` | Variables: `{{annotation}}`, `{{chapter}}`, `{{date}}` |
| Add heading per highlight | Off | Adds a heading above each highlight — enables `[[Note#Heading]]` embed links |
| Heading template | `### {{chapter}} — {{date}}` | Variables: `{{chapter}}`, `{{date}}`, `{{progress}}` |

### Colors

| Setting | Default | Description |
|---------|---------|-------------|
| Map colors to callouts | Off | Renders highlights as Obsidian callouts. Overrides quote format. |
| Yellow → | `question` | Callout type for yellow highlights |
| Red → | `danger` | Callout type for red highlights |
| Blue → | `note` | Callout type for blue highlights |
| Green → | `success` | Callout type for green highlights |

### Optional Features

| Setting | Default | Description |
|---------|---------|-------------|
| Import shelves as tags | Off | Adds your Kobo shelf/collection names as frontmatter tags |
| Generate reading dashboard | Off | Creates or updates a summary note listing all imported books |
| Dashboard path | `Kobo Highlights/Dashboard.md` | Where the dashboard note is saved |

### Reimport

| Setting | Default | Description |
|---------|---------|-------------|
| Allow overwrite | Off | Off = append-only (recommended). On = full note replacement on every import. |

---

## CSV Format

When using **Import from text/CSV**, column names are auto-detected (case-insensitive):

| Column | Aliases |
|--------|---------|
| Title | Book |
| Author | — |
| Highlight | Text, Quote |
| Chapter | Section |
| Date | Created, Added |
| Note | Annotation, Comment |

---

## Troubleshooting

**"No highlights found"**
- Make sure you selected `KoboReader.sqlite`, not another file
- The `.kobo` folder may be hidden — enable hidden files in your file explorer
- Dog-ears (bookmarks without selected text) are intentionally excluded

**"sql-wasm.wasm not found"**
- All three files must be present in the plugin folder: `main.js`, `manifest.json`, `sql-wasm.wasm`
- Reinstall the plugin to restore the missing file

**Device not detected automatically**
- Use **Import from SQLite file** to locate the file manually
- On Mac, the Kobo mounts under `/Volumes`
- On Linux, check `/media/<username>/KOBOeReader/.kobo/KoboReader.sqlite`

---

## Privacy

All processing is entirely local. No data is sent anywhere. The SQLite WASM binary is bundled in the plugin — no internet connection is needed at any point.

---

## License

MIT
