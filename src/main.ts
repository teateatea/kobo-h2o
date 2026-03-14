import { Notice, Plugin, TFile, normalizePath, Modal, App } from "obsidian";
import { KoboBook, KoboImporterSettings, DEFAULT_SETTINGS } from "./types";
import { parseSqliteFile, clearSqlJsCache } from "./sqlite-parser";
import { parseTxtFile, parseCsvFile } from "./text-parser";
import {
  renderBookNote,
  renderFilename,
  renderAppendBlock,
  extractExistingTexts,
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
    if (!await this.confirmIfOverwrite()) return;
    new Notice("Found Kobo - importing...");
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
        const books = await parseSqliteFile(buffer, this.pluginDir());
        await this.finishImport(books);
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
        await this.finishImport(books);
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

  private async importSqliteFromPath(sqlitePath: string) {
    try {
      const buf = fs.readFileSync(sqlitePath);
      const buffer = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      const books = await parseSqliteFile(buffer, this.pluginDir());
      await this.finishImport(books);
    } catch (err) {
      console.error("[KoboH2O]", err);
      new Notice(`Import failed: ${err.message}`, 8000);
    }
  }

  // -- Core import logic -----------------------------------------------------

  private async finishImport(books: KoboBook[]) {
    books = this.applyFilters(books);

    if (books.length === 0) {
      new Notice("No highlights found.");
      return;
    }

    const { created, updated } = await this.writeBooks(books);

    new Notice(
      `Done. ${created} note${created !== 1 ? "s" : ""} created, ${updated} updated.`,
      5000
    );
  }

  private applyFilters(books: KoboBook[]): KoboBook[] {
    const min = this.settings.minHighlightWords;
    if (min <= 0) return books;

    return books
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
  }

  private async writeBooks(books: KoboBook[]): Promise<{ created: number; updated: number }> {
    let created = 0, updated = 0;
    await this.ensureFolder(this.settings.outputFolder);

    for (const book of books) {
      const filename = renderFilename(book, this.settings);
      const filepath = normalizePath(`${this.settings.outputFolder}/${filename}.md`);
      const existing = this.app.vault.getAbstractFileByPath(filepath) as TFile | null;

      if (existing) {
        if (this.settings.allowOverwrite) {
          await this.app.vault.modify(existing, renderBookNote(book, this.settings));
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
            await this.app.vault.append(existing, renderAppendBlock(newHighlights, book, this.settings));
            updated++;
          }
        }
      } else {
        await this.app.vault.create(filepath, renderBookNote(book, this.settings));
        created++;
      }
    }

    return { created, updated };
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
