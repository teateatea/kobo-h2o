# Kobo-Highlights-2-Obsidian

Import your highlights and annotations from your Kobo e-reader directly into Obsidian, with configurable formatting.

This plugin was orginially just meant for my personal usage, because I couldn't find a tool that matched my workflow quite right. But it's possible that my work habits are similar to your work habits, so I'm sharing it with the Obsidian community here.

---

## Summary

- **Import methods:** Direct from USB device, or use .SQLite, .txt, or .csv file.
- **Configurable format:** Create custom import templates based on all data Kobo provides (title, author, series, date_highlighted, etc).
- **Fully offline:** — Local software only! No data leaves your machine, no internet needed to use.

---

## Installation
### Requirements
- Node.js
- [REVISIT: Confirm nothing else, the sqlite wasm is included right?]

### From Community Plugins (recommended)

1. Open **Settings → Community plugins → Browse**
2. Search for **Kobo-H2O**
3. Click **Install**, then **Enable**

### Build from Source *("I work with git regularly.")*
Instructions for people comfortable with development.

1. Clone repo

```bash
git clone https://github.com/teateatea/kobo-h2o
cd kobo-h2o
```

2. Edit `deploy.mjs` to set your vault path, then:

```bash
npm install
npm run deploy
```

3. Open **Settings → Community plugins** and enable the plugin.


---

### Manual Installation *("I grew up with computers.")*
Instructions for people immersed in technology.

1. Download the latest release from GitHub.
2. Extract `main.js`, `manifest.json`, and `sql-wasm.wasm` into your vault's plugin folder:
   ```
   <vault>/.obsidian/plugins/kobo-highlights-2-obsidian/
   ```
3. Open **Settings → Community plugins** and enable the plugin.

---

#### Manual Installation *("Help me with the tech please.")*
Instructions for people who *love* books, but only *like* computers.

###### 1. Download from github
On this github page (https://github.com/teateatea/kobo-h2o), there's a highlighted button that says "< > Code" near the top right. Click it, then choose "Download Zip" at the bottom.

###### 2. Extract from zip file
Once downloaded, open that zip file (kobo-h2o-main.zip, in your downloads folder), then "Extract all". There's the plugin files!

###### 3. Run the SETUP
In the extracted folder (kobo-h2o-main, not .zip!), you'll find "SETUP.bat". Please run it!

Your computer should warn you that I'm a stranger, and it's up to you to decide if you actually trust strangers on the internet. If you do, it'll open a terminal where some colourful code zooms by to set up the plugin for you.

If all goes well, it's going to stop to ask where your Obsidian vault folder is, which should be something like:

`C:\Users\YOUR-NAME\Documents\YOUR-OBSIDIAN-VAULT`

Type or paste that in, then press enter to continue setting up.

###### 4. On Obsidian, toggle the plugin in
Open Obsidian, then go to Settings > Community Plugins.

(It may ask you to specifically enable Community Plugins here, again, because we're internet strangers.)

Scroll down to "Kobo H2O" and toggle it on!

The plugin is now ready to go!

---

## Usage

### Importing highlights

Open the command palette (`Cmd/Ctrl+R`) and run one of: [REVISIT confirm default shortcuts]

| Command | When to use |
|---------|-------------|
| **Import from Kobo device** | Connect via USB |
| **Import from file** | Manually locate `KoboReader.sqlite` (inside the `.kobo` folder on your device) |
| **Import from file** | Use a highlights file exported from your Kobo or a third-party tool |

[REVISIT best way to present this info, especially regarding the various first and third party tools.]

---

## Settings

### Reimporting

By default the plugin is **append-only**: new highlights are added under a `## New Highlights (date)` heading, and existing content is never touched. Enable **Allow Overwrite** in settings if you want full note replacement instead.

---

## Output Format
[revisit with screenshots]

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

### Output
[revisit, consider wiki for details instead]

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

###### Titles, authors, or series are wrong or look weird!
- This pluin collects the metadata exactly the way it's been stored on your device. There are some basic settings to process common formats during import, but no changes are made to the files on your device. See wiki for details.
- The best thing to do is cleaning up your sources: Try https://calibre-ebook.com, it's a popular ebook manager that can help tidy up the metadata.

###### I can't find my .sqlite file!
- The `.kobo` folder may be hidden. In your file explorer,  enable "Show hidden files".


###### "No highlights found"
- Make sure you selected `KoboReader.sqlite`, not another file (for example, NOT `book.sqlite` [revisit, what's that other sqlite file in there by default?]).
- Make sure you actually have highlights in your books!

###### Device not being detected by USB?
- Confirm that your device is physically connected, on both sides of your USB cable.
- Try a different cable: Some older cables are only for charging, and don't actually support data transfer.
- On Windows, check `insert drive location`
- On Mac, the Kobo mounts under `/Volumes`
- On Linux, check `/media/<username>/KOBOeReader/.kobo/KoboReader.sqlite`
- Consider using **Import from file**, with another way to locate the file manually. [revisit, specific instructions for the various third party work flows.]


---

## Privacy

All processing is local, no data is sent anywhere (other than from your Kobo to your computer). The SQLite WASM binary is bundled in the plugin — no internet connection is needed, after installation.

Claude Code was used during plugin development, but the plugin you install uses only basic processing to work. No AI functionality is included.

---

## License

MIT
