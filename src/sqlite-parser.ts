import { KoboBook, KoboHighlight } from "./types";
import { sanitizeFilename } from "./utils";

// Node.js built-ins — desktop only (isDesktopOnly: true in manifest.json)
const fs = require("fs") as typeof import("fs");
const path = require("path") as typeof import("path");

// -- Public API ----------------------------------------------------------------

export async function parseSqliteFile(
  buffer: ArrayBuffer,
  pluginDir: string
): Promise<KoboBook[]> {
  const SQL = await loadSqlJs(pluginDir);
  const db = new SQL.Database(new Uint8Array(buffer));

  try {
    const bookMap = queryBooks(db);
    attachShelves(db, bookMap);
    return Array.from(bookMap.values()).filter((b) => b.highlights.length > 0);
  } finally {
    db.close();
  }
}

// -- Queries -------------------------------------------------------------------

function queryBooks(db: any): Map<string, KoboBook> {
  const results = db.exec(`
    SELECT
      b.Text,
      b.Annotation,
      b.DateCreated,
      b.ChapterProgress,
      b.VolumeID,
      book.Title        AS book_title,
      book.Attribution  AS author,
      book.ISBN,
      book.Publisher,
      book.Language,
      book.Series,
      book.SeriesNumber,
      book.DateLastRead,
      book.___PercentRead AS percent_read,
      ch.Title          AS chapter_title
    FROM Bookmark b
    JOIN content book ON book.ContentID = b.VolumeID
    LEFT JOIN content ch ON ch.ContentID = b.ContentID AND ch.ContentType = '9'
    WHERE b.Text IS NOT NULL
      AND TRIM(b.Text) != ''
      AND b.Type = 'highlight'
    ORDER BY book.Title, b.DateCreated
  `);

  const bookMap = new Map<string, KoboBook>();
  if (!results || results.length === 0) return bookMap;

  const { columns, values } = results[0];
  const col = (name: string) => columns.indexOf(name);

  for (const row of values) {
    const get = (name: string): string | null =>
      (row[col(name)] as string | null);
    const getNum = (name: string): number =>
      Number(row[col(name)] ?? 0);

    const volumeId = get("VolumeID") ?? "unknown";
    const bookTitle = sanitizeFilename(get("book_title") ?? "Unknown Title");
    const bookAuthor = get("author") ?? undefined;

    if (!bookMap.has(volumeId)) {
      bookMap.set(volumeId, {
        title: bookTitle,
        author: bookAuthor,
        isbn: get("ISBN") ?? undefined,
        publisher: get("Publisher") ?? undefined,
        language: get("Language") ?? undefined,
        series: get("Series") ?? undefined,
        seriesNumber: get("SeriesNumber") ?? undefined,
        dateLastRead: get("DateLastRead") ?? undefined,
        percentRead: getNum("percent_read"),
        highlightCount: 0,
        annotationCount: 0,
        shelves: [],
        highlights: [],
      });
    }

    const text = (get("Text") ?? "").trim();
    if (!text) continue;

    const annotation = get("Annotation") ?? undefined;

    const highlight: KoboHighlight = {
      text,
      annotation,
      chapter: cleanChapter(get("chapter_title")),
      dateCreated: get("DateCreated") ?? "",
      chapterProgress: getNum("ChapterProgress"),
      bookTitle,
      bookAuthor,
    };

    const book = bookMap.get(volumeId)!;
    book.highlights.push(highlight);
    book.highlightCount++;
    if (annotation) book.annotationCount++;
  }

  return bookMap;
}

function attachShelves(db: any, bookMap: Map<string, KoboBook>) {
  try {
    const results = db.exec(`
      SELECT DISTINCT b.VolumeID, s.Name
      FROM Bookmark b
      JOIN ShelfContent sc ON sc.ContentId = b.VolumeID
      JOIN Shelf s ON s.InternalName = sc.ShelfName
      WHERE b.Type = 'highlight'
        AND (sc._IsDeleted = 'false' OR sc._IsDeleted IS NULL)
    `);
    if (!results || results.length === 0) return;

    for (const row of results[0].values) {
      const volumeId = row[0] as string;
      const shelfName = row[1] as string;
      const book = bookMap.get(volumeId);
      if (book && !book.shelves.includes(shelfName)) {
        book.shelves.push(shelfName);
      }
    }
  } catch {
    // Shelves unavailable on older firmware - silently skip
  }
}

// -- Chapter cleaning ----------------------------------------------------------

function cleanChapter(raw: string | null): string | undefined {
  if (!raw) return undefined;
  const s = raw.trim();
  if (!s) return undefined;

  const isPath =
    /[/\\]/.test(s) || /\.(html?|xhtml?|xml|opf|ncx)$/i.test(s);

  if (!isPath) return s;

  const stem = s
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .replace(/\.(html?|xhtml?|xml|opf|ncx)$/i, "")
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return stem || s;
}

// -- sql.js loader -------------------------------------------------------------

let _sqlJsInstance: any = null;

export function clearSqlJsCache(): void {
  _sqlJsInstance = null;
}

async function loadSqlJs(pluginDir: string): Promise<any> {
  if (_sqlJsInstance) return _sqlJsInstance;

  const sqlJsInit = require("sql.js/dist/sql-wasm.js");
  const wasmPath = path.join(pluginDir, "sql-wasm.wasm");

  let wasmBinary: Buffer;
  try {
    wasmBinary = fs.readFileSync(wasmPath);
  } catch {
    throw new Error(
      `Kobo Highlights 2 Obsidian: sql-wasm.wasm not found at ${wasmPath}. Reinstall the plugin to restore it.`
    );
  }

  _sqlJsInstance = await sqlJsInit({ wasmBinary });
  return _sqlJsInstance;
}

// sanitizeFilename imported from ./utils
