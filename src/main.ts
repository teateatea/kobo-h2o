import { Notice, Plugin, TFile, normalizePath, Modal, App } from "obsidian";
import { KoboBook, KoboWord, KoboImporterSettings, DEFAULT_SETTINGS } from "./types";
import { parseSqliteFile, clearSqlJsCache } from "./sqlite-parser";
import type { ParseResult } from "./sqlite-parser";
import { parseTxtFile, parseCsvFile } from "./text-parser";
import {
  renderBookNote,
  renderFilename,
  renderAppendBlock,
  extractExistingTexts,
  renderWordListNote,
  renderWordListAppend,
} from "./renderer";
import { KoboSettingsTab } from "./settings-tab";

// Node.js built-ins — desktop only (isDesktopOnly: true in manifest.json)
const fs = require("fs") as typeof import("fs");
const path = require("path") as typeof import("path");

export default class KoboPlugin extends Plugin {
  settings: KoboImporterSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new KoboSettingsTab(this.app, this));

    this.addCommand({
      id: "import-kobo-device",
      name: "Import from Kobo device",
      callback: () => this.importFromKoboDevice(),
    });

    this.addCommand({
      id: "import-sqlite-file",
      name: "Import from SQLite file",
      callback: () => this.importFromSqliteFile(),
    });

    this.addCommand({
      id: "import-text",
      name: "Import from text/CSV export",
      callback: () => this.importFromTextFile(),
    });

  }

  async loadSettings() {
    const saved = await this.loadData();
    // Migrate renamed field: shelvesAsTagsEnabled -> collectionsAsListEnabled
    if (saved && "shelvesAsTagsEnabled" in saved && !("collectionsAsListEnabled" in saved)) {
      saved.collectionsAsListEnabled = saved.shelvesAsTagsEnabled;
      delete saved.shelvesAsTagsEnabled;
    }
this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    clearSqlJsCache();
  }

  // -- Import flows ----------------------------------------------------------

  private async importFromKoboDevice() {
    const sqlitePath = this.findKoboDevice();
    if (!sqlitePath) {
      new Notice("Kobo device not found. Use 'Import from SQLite file' to locate it manually.", 7000);
      return;
    }
    new Notice("Kobo device detected.", 7000);
    const deviceName = this.deviceNameFromPath(sqlitePath);
    setTimeout(() => new Notice(`${deviceName} found!`, 9000), 500);
    if (!await this.confirmIfOverwrite()) return;
    await this.importSqliteFromPath(sqlitePath);
  }

  private async importFromSqliteFile() {
    if (!await this.confirmIfOverwrite()) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".sqlite,.db";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const buffer = await file.arrayBuffer();
        const { books, words } = await parseSqliteFile(buffer, this.pluginDir());
        const result = await this.selectBooks(books, words);
        if (result === null) return;
        await this.finishImport(result.books, result.words, result.importMyWords, file.name);
      } catch (err) {
        console.error("[KoboH2O]", err);
        new Notice(`Import failed: ${err.message}`, 8000);
      }
    };
    input.click();
  }

  private async importFromTextFile() {
    if (!await this.confirmIfOverwrite()) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.csv,.tsv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = new TextDecoder("utf-8").decode(await file.arrayBuffer());
        const ext = file.name.split(".").pop()?.toLowerCase();
        const books = ext === "csv" || ext === "tsv"
          ? parseCsvFile(text, file.name)
          : parseTxtFile(text, file.name);
        const result = await this.selectBooks(books, []);
        if (result === null) return;
        await this.finishImport(result.books, [], false);
      } catch (err) {
        console.error("[KoboH2O]", err);
        new Notice(`Import failed: ${err.message}`, 8000);
      }
    };
    input.click();
  }

  // -- Device detection ------------------------------------------------------

  private findKoboDevice(): string | null {
    try {
      const koboDir = ".kobo";
      const sqliteFile = "KoboReader.sqlite";

      for (const drive of "DEFGHIJKLMNOPQRSTUVWXYZ".split("")) {
        const koboPath = path.join(`${drive}:\\`, koboDir);
        if (!fs.existsSync(koboPath)) continue;
        const candidate = path.join(koboPath, sqliteFile);
        if (fs.existsSync(candidate)) return candidate;
      }

      for (const root of ["/Volumes", "/media", "/mnt/media"]) {
        if (!fs.existsSync(root)) continue;
        for (const entry of fs.readdirSync(root)) {
          const koboPath = path.join(root, entry, koboDir);
          if (!fs.existsSync(koboPath)) continue;
          const candidate = path.join(koboPath, sqliteFile);
          if (fs.existsSync(candidate)) return candidate;
        }
      }
    } catch {
      // fs unavailable - fall through
    }

    return null;
  }

  private deviceNameFromPath(sqlitePath: string): string {
    // Windows: sqlitePath = "D:\\.kobo\\KoboReader.sqlite"
    //   -> drive letter "D:"
    const parsed = path.parse(sqlitePath);
    const root = parsed.root; // e.g. "D:\\" or "/"
    if (root && root !== "/") {
      // Windows - return the drive letter (e.g. "D:")
      return root.replace(/[\\\/]+$/, "");
    }
    // macOS/Linux: sqlitePath = "/Volumes/KOBOeReader/.kobo/KoboReader.sqlite"
    //   -> split on separator, find the segment just before ".kobo"
    const parts = sqlitePath.split(path.sep);
    const koboIdx = parts.indexOf(".kobo");
    if (koboIdx > 0) {
      return parts[koboIdx - 1];
    }
    // Fallback
    return "Kobo";
  }

  private async importSqliteFromPath(sqlitePath: string) {
    try {
      const buf = fs.readFileSync(sqlitePath);
      const buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      const { books, words } = await parseSqliteFile(buffer, this.pluginDir());
      const result = await this.selectBooks(books, words);
      if (result === null) return;
      new Notice("Importing...");
      await this.finishImport(result.books, result.words, result.importMyWords, "KoboReader.sqlite");
    } catch (err) {
      console.error("[KoboH2O]", err);
      new Notice(`Import failed: ${err.message}`, 8000);
    }
  }

  // -- Core import logic -----------------------------------------------------

  private async finishImport(books: KoboBook[], words: KoboWord[], importMyWords: boolean, sourceFileName?: string) {
    books = this.applyFilters(books);

    if (books.length === 0 && !(importMyWords && words.length > 0)) {
      if (sourceFileName && sourceFileName !== "KoboReader.sqlite") {
        new Notice(`File selected: ${sourceFileName}`, 8000);
        new Notice("Please select your KoboReader.sqlite file.", 8000);
      } else {
        new Notice("There are 0 books with highlights here!");
      }
      return;
    }

    const { created, updated } = await this.writeBooks(books);

    let wordsAdded = 0;
    if (importMyWords && words.length > 0) {
      wordsAdded = await this.writeWordListNote(words);
    }

    new Notice(
      `Done. ${created} note${created !== 1 ? "s" : ""} created, ${updated} updated${wordsAdded > 0 ? `, ${wordsAdded} word${wordsAdded !== 1 ? "s" : ""} added to My Words` : ""}.`,
      5000
    );
  }

  private selectBooks(
    books: KoboBook[],
    words: KoboWord[],
  ): Promise<{ books: KoboBook[]; words: KoboWord[]; importMyWords: boolean } | null> {
    return new Promise((resolve) => {
      new BookSelectionModal(this.app, books, words, this.settings, resolve).open();
    });
  }

  private applyFilters(books: KoboBook[]): KoboBook[] {
    const min = this.settings.minHighlightWords;
    let result = min <= 0 ? books : books
      .map((b) => {
        const filtered = b.highlights.filter(
          (h) => h.text.split(/\s+/).filter(Boolean).length >= min
        );
        return {
          ...b,
          highlights: filtered,
          highlightCount: filtered.length,
          annotationCount: filtered.filter((h) => !!h.annotation).length,
        };
      })
      .filter((b) => b.highlights.length > 0);

    // Apply importHighlights / importAnnotations toggles
    if (!this.settings.importHighlights || !this.settings.importAnnotations) {
      result = result
        .map((b) => {
          const filtered = b.highlights.filter((h) => {
            const hasAnnotation = !!h.annotation;
            return hasAnnotation
              ? this.settings.importAnnotations
              : this.settings.importHighlights;
          });
          return {
            ...b,
            highlights: filtered,
            highlightCount: filtered.length,
            annotationCount: filtered.filter((h) => !!h.annotation).length,
          };
        })
        .filter((b) => b.highlights.length > 0);
    }

    if (this.settings.highlightSortOrder === "position") {
      for (const b of result) {
        b.highlights.sort((a, c) => a.chapterProgress - c.chapterProgress);
      }
    }

    return result;
  }

  private async writeBooks(books: KoboBook[]): Promise<{ created: number; updated: number }> {
    let created = 0, updated = 0;
    await this.ensureFolder(this.settings.outputFolder);

    for (const book of books) {
      const filename = renderFilename(book, this.settings);
      const filepath = normalizePath(`${this.settings.outputFolder}/${filename}.md`);
      const existing = this.getFileCaseInsensitive(filepath);

      if (existing) {
        const createdDate = new Date(existing.stat.ctime).toISOString();
        if (this.settings.allowOverwrite) {
          if (existing.path !== filepath) {
            await this.app.vault.rename(existing, filepath);
          }
          await this.app.vault.modify(existing, renderBookNote(book, this.settings, createdDate));
          updated++;
        } else {
          const content = await this.app.vault.read(existing);
          const existingTexts = extractExistingTexts(content);
          // Part B: for multi-line highlights, also check the first line (≥10 chars)
          // against the set, since extractExistingTexts captures only the first blockquote line.
          const firstLine = (t: string) => t.split("\n")[0].trim();
          const newHighlights = book.highlights.filter(
            (h) =>
              !existingTexts.has(h.text.trim()) &&
              !(firstLine(h.text).length >= 10 && existingTexts.has(firstLine(h.text)))
          );
          if (newHighlights.length > 0) {
            await this.app.vault.append(existing, renderAppendBlock(newHighlights, book, this.settings, createdDate));
            updated++;
          }
        }
      } else {
        const createdDate = new Date().toISOString();
        await this.app.vault.create(filepath, renderBookNote(book, this.settings, createdDate));
        created++;
      }
    }

    return { created, updated };
  }

  private async writeWordListNote(words: KoboWord[]): Promise<number> {
    await this.ensureFolder(this.settings.outputFolder);
    const title = (this.settings.myWordsNoteTitle || "My Words (Kobo)")
      .replace(/[/:*?"<>|\\]/g, " ").trim();
    const filepath = normalizePath(`${this.settings.outputFolder}/${title}.md`);
    const existing = this.getFileCaseInsensitive(filepath);

    if (existing) {
      if (this.settings.allowOverwrite) {
        await this.app.vault.modify(existing, renderWordListNote(words, this.settings));
        return words.length;
      }
      const content = await this.app.vault.read(existing);
      // date_imported is a mandatory frontmatter field when importMyWords is on.
      // It stores the max DateCreated of the last imported batch in Kobo-clock time,
      // so comparisons stay in Kobo-clock domain and a consistently offset clock cancels out.
      const dateImportedMatch = content.match(/^date_imported:\s*(.+)$/m);
      if (!dateImportedMatch) {
        new Notice(
          "My Words: date_imported missing from note frontmatter. Delete the note or add date_imported: to resume appending.",
          8000
        );
        return 0;
      }
      const lastImported = dateImportedMatch[1].trim();

      const newWords = words.filter((w) => w.dateCreated > lastImported);
      if (newWords.length === 0) return 0;

      // Update date_imported to the max DateCreated of the new batch, then write
      // the updated frontmatter + appended words in a single modify call.
      const newMaxDate = newWords.reduce((m, w) => w.dateCreated > m ? w.dateCreated : m, "");
      const updatedContent = content.replace(
        /^date_imported: .+$/m,
        `date_imported: ${newMaxDate}`
      );
      await this.app.vault.modify(existing, updatedContent + renderWordListAppend(newWords, this.settings));
      return newWords.length;
    }

    await this.app.vault.create(filepath, renderWordListNote(words, this.settings));
    return words.length;
  }

  private getFileCaseInsensitive(filepath: string): TFile | null {
    const lower = filepath.toLowerCase();
    return this.app.vault.getFiles().find(
      (f) => f.path.toLowerCase() === lower
    ) ?? null;
  }

  private async ensureFolder(folder: string) {
    const normalized = normalizePath(folder);
    if (!(await this.app.vault.adapter.exists(normalized))) {
      await this.app.vault.createFolder(normalized);
    }
  }

  // -- Helpers ---------------------------------------------------------------

  private async confirmIfOverwrite(): Promise<boolean> {
    if (!this.settings.allowOverwrite) return true;
    return new Promise<boolean>((resolve) => {
      new OverwriteConfirmModal(this.app, resolve).open();
    });
  }

  private pluginDir(): string {
    const adapter = this.app.vault.adapter as any;
    const base = adapter.getBasePath?.() ?? "";
    return path.join(base, this.app.vault.configDir, "plugins", this.manifest.id);
  }
}

// -- Overwrite confirmation modal ----------------------------------------------

class OverwriteConfirmModal extends Modal {
  constructor(app: App, private resolve: (confirmed: boolean) => void) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Overwrite enabled" });

    const warn = contentEl.createEl("p", {
      text: "Allow Overwrite is on. Any edits you have made inside existing book notes will be permanently lost. Are you sure you want to continue?",
    });
    warn.style.color = "var(--color-red)";

    const row = contentEl.createDiv({
      attr: { style: "display:flex;gap:12px;margin-top:16px" },
    });

    const cancelBtn = row.createEl("button", {
      text: "Cancel",
      attr: { style: "flex:1;padding:10px" },
    });
    cancelBtn.onclick = () => { this.close(); this.resolve(false); };

    const confirmBtn = row.createEl("button", {
      text: "Yes, overwrite",
      cls: "mod-warning",
      attr: { style: "flex:1;padding:10px" },
    });
    confirmBtn.onclick = () => { this.close(); this.resolve(true); };
  }

  onClose() { this.contentEl.empty(); }
}

// -- Book selection modal ------------------------------------------------------

class BookSelectionModal extends Modal {
  private checked: Set<number>;
  private myWordsChecked: boolean;
  private resolved = false;

  constructor(
    app: App,
    private books: KoboBook[],
    private words: KoboWord[],
    private settings: KoboImporterSettings,
    private resolve: (result: { books: KoboBook[]; words: KoboWord[]; importMyWords: boolean } | null) => void,
  ) {
    super(app);
    this.checked = new Set(books.map((_, i) => i));
    this.myWordsChecked = settings.importMyWords && words.length > 0;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Select books to import" });

    const hint = contentEl.createEl("p", {
      text: `${this.books.length} book${this.books.length !== 1 ? "s" : ""} found. Uncheck any you want to skip.`,
    });
    hint.style.marginBottom = "12px";

    // Select all / none controls
    const controls = contentEl.createDiv({ attr: { style: "display:flex;gap:12px;margin-bottom:8px" } });
    const allBtn = controls.createEl("button", { text: "Select all" });
    allBtn.onclick = () => {
      this.books.forEach((_, i) => this.checked.add(i));
      checkboxes.forEach((cb) => (cb.checked = true));
    };
    const noneBtn = controls.createEl("button", { text: "Select none" });
    noneBtn.onclick = () => {
      this.checked.clear();
      checkboxes.forEach((cb) => (cb.checked = false));
    };

    // Scrollable book list
    const list = contentEl.createDiv({
      attr: { style: "max-height:400px;overflow-y:auto;border:1px solid var(--background-modifier-border);border-radius:4px;padding:8px;margin-bottom:16px" },
    });
    const checkboxes: HTMLInputElement[] = [];

    // My Words row at top (if enabled and words exist)
    if (this.settings.importMyWords && this.words.length > 0) {
      const mwRow = list.createDiv({ attr: { style: "display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid var(--background-modifier-border);margin-bottom:4px" } });
      const mwCb = mwRow.createEl("input", { type: "checkbox" }) as HTMLInputElement;
      mwCb.checked = this.myWordsChecked;
      mwCb.onchange = () => { this.myWordsChecked = mwCb.checked; };
      const mwLabel = mwRow.createEl("label");
      mwLabel.setText(`${this.settings.myWordsNoteTitle || "My Words (Kobo)"} (${this.words.length} word${this.words.length !== 1 ? "s" : ""})`);
      mwLabel.style.cursor = "pointer";
      mwLabel.onclick = () => { mwCb.checked = !mwCb.checked; mwCb.onchange?.(new Event("change")); };
    }

    this.books.forEach((book, i) => {
      const row = list.createDiv({ attr: { style: "display:flex;align-items:center;gap:8px;padding:4px 0" } });
      const cb = row.createEl("input", { type: "checkbox" }) as HTMLInputElement;
      cb.checked = true;
      cb.onchange = () => {
        if (cb.checked) this.checked.add(i);
        else this.checked.delete(i);
      };
      checkboxes.push(cb);

      const label = row.createEl("label");
      const title = book.title;
      const author = book.author ? ` - ${book.author}` : "";
      const countText = `${book.highlightCount} highlight${book.highlightCount !== 1 ? "s" : ""}`;

      const titleSpan = label.createEl("span", { text: `${title}${author}` });
      titleSpan.style.fontSize = "1.05em";

      const countSpan = label.createEl("span", { text: countText });
      countSpan.style.display = "block";
      countSpan.style.color = "var(--text-muted)";
      countSpan.style.fontSize = "0.85em";
      label.style.cursor = "pointer";
      label.onclick = () => { cb.checked = !cb.checked; cb.onchange?.(new Event("change")); };
    });

    // Action buttons
    const row = contentEl.createDiv({ attr: { style: "display:flex;gap:12px" } });
    const cancelBtn = row.createEl("button", { text: "Cancel", attr: { style: "flex:1;padding:10px" } });
    cancelBtn.onclick = () => { this.resolved = true; this.close(); this.resolve(null); };

    const importBtn = row.createEl("button", {
      text: "Import selected",
      cls: "mod-cta",
      attr: { style: "flex:1;padding:10px" },
    });
    importBtn.onclick = () => {
      const selected = this.books.filter((_, i) => this.checked.has(i));
      this.resolved = true;
      this.close();
      this.resolve({ books: selected, words: this.words, importMyWords: this.myWordsChecked });
    };
  }

  onClose() {
    this.contentEl.empty();
    if (!this.resolved) { this.resolved = true; this.resolve(null); }
  }
}
