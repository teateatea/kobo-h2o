import { KoboBook, KoboHighlight } from "./types";
import { sanitizeFilename } from "./utils";

// Matches the Kobo My Clippings separator (10 or more '=' signs, any firmware variant)
const CLIPPINGS_SEP = /^={5,}$/;

// -- Public API ----------------------------------------------------------------

export function parseTxtFile(content: string, filename: string): KoboBook[] {
  const lines = content.split(/\r?\n/);
  if (content.includes("==========")) {
    return parseKoboClippings(lines, filename);
  }
  return parsePlainText(content, filename);
}

export function parseCsvFile(content: string, filename: string): KoboBook[] {
  const delimiter = filename.toLowerCase().endsWith(".tsv") ? "\t" : ",";
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0], delimiter).map((h) => h.toLowerCase().trim());
  const idx = (names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };

  const titleIdx = idx(["title", "book"]);
  const authorIdx = idx(["author"]);
  const textIdx = idx(["highlight", "text", "quote"]);
  const chapterIdx = idx(["chapter", "section"]);
  const dateIdx = idx(["date", "created", "added"]);
  const noteIdx = idx(["note", "annotation", "comment"]);

  if (textIdx < 0) {
    throw new Error(
      "Could not find a highlight/text column. " +
      "Expected a column named Highlight, Text, or Quote."
    );
  }

  const bookMap = new Map<string, KoboBook>();
  const today = new Date().toISOString();

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVRow(lines[i], delimiter);
    const text = row[textIdx]?.trim();
    if (!text) continue;

    const title = sanitizeFilename(
      titleIdx >= 0 ? row[titleIdx]?.trim() : filename.replace(/\.[^/.]+$/, "")
    ) || "Unknown";
    const author = authorIdx >= 0 ? row[authorIdx]?.trim() : undefined;
    const key = `${title}::${author ?? ""}`;

    if (!bookMap.has(key)) {
      bookMap.set(key, {
        title,
        author,
        percentRead: 0,
        highlightCount: 0,
        annotationCount: 0,
        shelves: [],
        highlights: [],
      });
    }

    const annotation = noteIdx >= 0 ? row[noteIdx]?.trim() : undefined;
    const book = bookMap.get(key)!;

    book.highlights.push({
      text,
      chapter: chapterIdx >= 0 ? row[chapterIdx]?.trim() : undefined,
      dateCreated: dateIdx >= 0 ? row[dateIdx]?.trim() || today : today,
      annotation,
      chapterProgress: 0,
    });

    book.highlightCount++;
    if (annotation) book.annotationCount++;
  }

  return [...bookMap.values()].filter((b) => b.highlights.length > 0);
}

// -- Kobo clippings format -----------------------------------------------------

function parseKoboClippings(lines: string[], _filename: string): KoboBook[] {
  const bookMap = new Map<string, KoboBook>();
  let currentBook: KoboBook | null = null;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]?.trim();

    if (!line || CLIPPINGS_SEP.test(line)) {
      i++;
      continue;
    }

    const nextLine = lines[i + 1]?.trim();
    const sepLine = lines[i + 2]?.trim();

    if (sepLine && CLIPPINGS_SEP.test(sepLine)) {
      const title = sanitizeFilename(line);
      const author = sanitizeFilename(nextLine ?? "");
      const key = `${title}::${author}`;
      if (!bookMap.has(key)) {
        bookMap.set(key, {
          title,
          author,
          percentRead: 0,
          highlightCount: 0,
          annotationCount: 0,
          shelves: [],
          highlights: [],
        });
      }
      currentBook = bookMap.get(key)!;
      i += 3;
      continue;
    }

    const metaMatch = line.match(/^Your Highlight.*?\|\s*Added on (.+)$/i);
    if (metaMatch) {
      const dateCreated = metaMatch[1].trim();
      i++;
      if (lines[i]?.trim() === "") i++;

      const textLines: string[] = [];
      while (i < lines.length && !CLIPPINGS_SEP.test(lines[i]?.trim() ?? "")) {
        textLines.push(lines[i]);
        i++;
      }
      i++;

      const text = textLines.join("\n").trim();
      if (text && currentBook) {
        currentBook.highlights.push({
          text,
          dateCreated,
          chapterProgress: 0,
        });
        currentBook.highlightCount++;
      }
      continue;
    }

    i++;
  }

  return [...bookMap.values()].filter((b) => b.highlights.length > 0);
}

function parsePlainText(content: string, filename: string): KoboBook[] {
  const title = sanitizeFilename(filename.replace(/\.[^/.]+$/, ""));
  const today = new Date().toISOString();
  const highlights: KoboHighlight[] = content
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((text) => ({ text, dateCreated: today, chapterProgress: 0 }));

  if (!highlights.length) return [];
  return [{
    title,
    percentRead: 0,
    highlightCount: highlights.length,
    annotationCount: 0,
    shelves: [],
    highlights,
  }];
}

// -- CSV / TSV parser ----------------------------------------------------------

function parseCSVRow(line: string, delimiter = ","): string[] {
  const result: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === delimiter && !inQ) {
      result.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}
