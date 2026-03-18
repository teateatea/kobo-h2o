import { moment } from "obsidian";
import { KoboBook, KoboHighlight, KoboImporterSettings } from "./types";
import { preprocessConditionals } from "./template-parser";

// -- Note title / filename -----------------------------------------------------

export function renderFilename(book: KoboBook, settings: KoboImporterSettings): string {
  const importDate = isoDate(new Date());
  const raw = applyVars(settings.noteTitleTemplate, bookVars(book, importDate, importDate, settings, false));
  const replacement = settings.noteTitleInvalidCharReplacement;
  return raw
    .replace(/[/:*?"<>|\\]/g, replacement)
    .replace(/ {2,}/g, " ")
    .replace(/^\.+|\.+$/g, "")
    .trim() || "Untitled";
}

// -- Full book note ------------------------------------------------------------

export function renderBookNote(book: KoboBook, settings: KoboImporterSettings, createdDate: string): string {
  const importDate = new Date().toISOString();
  const parts: string[] = [];

  const fm = renderFrontmatter(book, settings, importDate, createdDate);
  if (fm) parts.push(fm);

  const heading = renderNoteHeading(book, settings, importDate, createdDate);
  if (heading) parts.push(heading);

  parts.push("");

  for (let i = 0; i < book.highlights.length; i++) {
    parts.push(renderHighlight(book.highlights[i], book, settings, importDate, i, createdDate));
  }

  const footer = renderFooter(book, settings, importDate, createdDate);
  if (footer) {
    parts.push("");
    parts.push(footer);
  }

  return parts.join("\n");
}

// -- Frontmatter ---------------------------------------------------------------

function renderFrontmatter(book: KoboBook, settings: KoboImporterSettings, importDate: string, createdDate: string): string {
  const tmpl = settings.frontmatterTemplate.trim();
  if (!tmpl) return "";

  const vars = {
    ...bookVars(book, importDate, createdDate, settings, false),
    percent_read: formatPercent((Number(book.percentRead) || 0) / 100, settings),
    highlight_count: String(book.highlightCount),
    annotation_count: String(book.annotationCount),
    isbn: book.isbn ?? "",
    publisher: book.publisher ?? "",
    language: book.language ?? "",
    // In frontmatter, {{collections}} is always a plain comma list (no wrapper)
    collections: book.shelves.join(", "),
  };

  let rendered = applyVarsMultiline(tmpl, vars, settings.frontmatterOmitEmptyLines);

  // When collections-as-list is enabled and there are shelves, expand the
  // collections: <value> line into a proper YAML block list.
  if (settings.collectionsAsListEnabled && book.shelves.length > 0) {
    const listLines = book.shelves.map((s) => `  - "${fmEscape(s)}"`).join("\n");
    rendered = rendered.replace(
      /^collections: .+$/m,
      `collections:\n${listLines}`
    );
  }

  return rendered + "\n";
}

// -- Note heading --------------------------------------------------------------

function renderNoteHeading(book: KoboBook, settings: KoboImporterSettings, importDate: string, createdDate: string): string {
  const tmpl = settings.noteHeadingTemplate.trim();
  if (!tmpl) return "";

  const vars = {
    ...bookVars(book, importDate, createdDate, settings, true),
    percent_read: formatPercent((Number(book.percentRead) || 0) / 100, settings),
    highlight_count: String(book.highlightCount),
    annotation_count: String(book.annotationCount),
    isbn: book.isbn ?? "",
    publisher: book.publisher ?? "",
    language: book.language ?? "",
  };

  return applyVarsMultiline(tmpl, vars, settings.noteHeadingOmitEmptyLines);
}

// -- Chapter title cleanup -----------------------------------------------------

function formatChapter(chapter: string, settings: KoboImporterSettings): string {
  if (!chapter) return chapter;
  let s = chapter;

  // #20 — Symbol normalization (each char in chapterSymbolsToReplace → chapterSymbolReplacement)
  if (settings.chapterSymbolsToReplace) {
    const target = settings.chapterSymbolReplacement ?? "-";
    for (const sym of settings.chapterSymbolsToReplace) {
      s = s.split(sym).join(target);
    }
  }

  // #16 — Add space at letter↔digit boundaries in both directions
  if (settings.chapterAddLetterNumberSpacing) {
    s = s.replace(/([A-Za-z])(\d)/g, "$1 $2").replace(/(\d)([A-Za-z])/g, "$1 $2");
  }

  // #17 — Strip leading zeros from any numeric sequence
  if (settings.chapterStripLeadingZeros) {
    s = s.replace(/\b0+(\d)/g, "$1");
  }

  // #19 — Prefix normalization
  if (settings.chapterPrefixNormalization !== "none") {
    const prefixRe = /^(chapter|ch)[\s._-]*/i;
    if (settings.chapterPrefixNormalization === "strip") {
      s = s.replace(prefixRe, "");
    } else {
      s = s.replace(prefixRe, settings.chapterPrefixNormalization + " ");
    }
  }

  // #18 — Trim words from start
  if (settings.chapterTrimStartWords > 0) {
    const words = s.trim().split(/\s+/);
    s = words.slice(settings.chapterTrimStartWords).join(" ");
  }

  // #18 — Trim words from end
  if (settings.chapterTrimEndWords > 0) {
    const words = s.trim().split(/\s+/);
    s = words.slice(0, words.length - settings.chapterTrimEndWords).join(" ");
  }

  return s.trim();
}

// -- Single highlight ----------------------------------------------------------

function koboColorName(color: number | undefined): string {
  switch (color) {
    case 0: case undefined: return "yellow";
    case 1: return "red";
    case 2: return "blue";
    case 3: return "green";
    default: return "grey";
  }
}

export function renderHighlight(
  h: KoboHighlight,
  book: KoboBook,
  settings: KoboImporterSettings,
  importDate: string,
  index: number = 0,
  createdDate?: string
): string {
  const cd = createdDate ?? importDate;
  const vars: Record<string, string> = {
    ...bookVars(book, importDate, cd, settings, true),
    highlight_text: normaliseHighlightText(h.text),
    chapter: formatChapter(h.chapter ?? "", settings),
    date_highlighted: formatDate(h.dateCreated, settings),
    page_percent: h.chapterProgress > 0 ? formatPercent(h.chapterProgress, settings) : "",
    highlight_number: String(index + 1),
    highlight_color: koboColorName(h.color),
    annotation: h.annotation
      ? renderAnnotation(h, book, settings, importDate, cd)
      : "",
  };

  const rendered = applyVarsMultiline(
    settings.highlightTemplate,
    vars,
    settings.highlightOmitEmptyLines
  );

  return rendered + "\n\n---\n";
}

function renderAnnotation(
  h: KoboHighlight,
  book: KoboBook,
  settings: KoboImporterSettings,
  importDate: string,
  createdDate?: string
): string {
  if (!h.annotation) return "";
  const vars: Record<string, string> = {
    ...bookVars(book, importDate, createdDate ?? importDate, settings, true),
    annotation_text: h.annotation,
    chapter: formatChapter(h.chapter ?? "", settings),
    date_annotated: formatDate(h.dateCreated, settings),
    page_percent: h.chapterProgress > 0 ? formatPercent(h.chapterProgress, settings) : "",
  };
  return applyVarsMultiline(settings.annotationTemplate, vars, settings.annotationOmitEmptyLines).trim();
}

// -- Footer --------------------------------------------------------------------

function renderFooter(book: KoboBook, settings: KoboImporterSettings, importDate: string, createdDate: string): string {
  const tmpl = settings.footerTemplate.trim();
  if (!tmpl) return "";

  const vars = {
    ...bookVars(book, importDate, createdDate, settings, true),
    percent_read: formatPercent((Number(book.percentRead) || 0) / 100, settings),
    highlight_count: String(book.highlightCount),
    annotation_count: String(book.annotationCount),
    isbn: book.isbn ?? "",
    publisher: book.publisher ?? "",
    language: book.language ?? "",
  };

  return applyVarsMultiline(tmpl, vars, settings.footerOmitEmptyLines);
}

// -- Append block --------------------------------------------------------------

export function renderAppendBlock(
  highlights: KoboHighlight[],
  book: KoboBook,
  settings: KoboImporterSettings,
  createdDate: string
): string {
  const importDate = new Date().toISOString();

  const headingVars = {
    ...bookVars(book, importDate, createdDate, settings, true),
    percent_read: formatPercent((Number(book.percentRead) || 0) / 100, settings),
    highlight_count: String(book.highlightCount),
    annotation_count: String(book.annotationCount),
    isbn: book.isbn ?? "",
    publisher: book.publisher ?? "",
    language: book.language ?? "",
  };

  const heading = settings.appendHeadingTemplate.trim()
    ? applyVarsMultiline(settings.appendHeadingTemplate, headingVars, settings.appendHeadingOmitEmptyLines)
    : "";

  const lines: string[] = [""];
  if (heading) {
    lines.push(heading, "");
  }

  for (let i = 0; i < highlights.length; i++) {
    lines.push(renderHighlight(highlights[i], book, settings, importDate, i, createdDate));
  }

  if (settings.footerAppendOnEachImport) {
    const footer = renderFooter(book, settings, importDate, createdDate);
    if (footer) {
      lines.push("");
      lines.push(footer);
    }
  }

  return lines.join("\n");
}

export function extractExistingTexts(noteContent: string): Set<string> {
  const texts = new Set<string>();
  // Capture the first line of every blockquote; Part B in writeBooks handles
  // multi-line highlights by also checking h.text's first line against this set.
  for (const match of noteContent.matchAll(/^> (.+)$/gm)) {
    texts.add(match[1].trim());
  }
  return texts;
}

// -- Variable helpers ----------------------------------------------------------

function bookVars(book: KoboBook, importDate: string, createdDate: string, settings: KoboImporterSettings | undefined, applyWrapper: boolean): Record<string, string> {
  return {
    title: formatTitle(book.title, settings),
    author: normalizeAuthor(book.author, settings, applyWrapper),
    series: book.series ?? "",
    series_number: book.seriesNumber ?? "",
    date_last_read: book.dateLastRead ? formatDate(book.dateLastRead, settings) : "",
    date_last_imported: formatDate(importDate, settings),
    date_note_created: formatDate(createdDate, settings),
    collections: wrapCollections(book.shelves, settings?.collectionsItemWrapper ?? "", settings?.collectionsItemSeparator ?? ", "),
  };
}

function normalizeAuthor(raw: string | undefined, settings: KoboImporterSettings | undefined, applyWrapper: boolean): string {
  if (!raw) return "";
  const authors = raw.split(/;\s*/).map((a) => a.trim()).filter(Boolean);
  const formatted = authors.map((a) => {
    if (settings?.authorNameOrder === "first-last") {
      const m = a.match(/^([^,]+),\s*(.+)$/);
      if (m) a = `${m[2].trim()} ${m[1].trim()}`;
    }
    if (settings?.authorNameOrder === "last-first") {
      // Convert "First Last" -> "Last, First" only if there is no comma already
      if (!a.includes(",")) {
        const parts = a.trim().split(/\s+/);
        if (parts.length >= 2) {
          const last = parts[parts.length - 1];
          const first = parts.slice(0, parts.length - 1).join(" ");
          a = `${last}, ${first}`;
        }
      }
    }
    if (applyWrapper) {
      const wrapper = settings?.authorNameWrapper ?? "";
      if (wrapper && wrapper.includes("##")) {
        return wrapper.replace(/##/g, a);
      }
    }
    return a;
  });
  return formatted.join(", ");
}

function formatPercent(value: number, settings?: KoboImporterSettings): string {
  const pct = Math.round(value * 100);
  switch (settings?.percentFormat) {
    case "percent": return `${pct}%`;
    case "decimal": return value.toFixed(2);
    case "PCT":     return `${pct}PCT`;
    case "pct":     return `${pct}pct`;
    default:        return String(pct);  // "integer" (default)
  }
}

function formatTitle(title: string, settings?: KoboImporterSettings): string {
  switch (settings?.titleCaseFormat) {
    case "title-case":
      return title.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    case "upper": return title.toUpperCase();
    case "lower": return title.toLowerCase();
    default: return title;
  }
}

/**
 * Renders a collections list as a comma-separated string, applying the user's
 * item wrapper if set. e.g. wrapper "[[##]]" → "[[Fiction]], [[Non-Fiction]]"
 */
function wrapCollections(shelves: string[], wrapper: string, separator = ", "): string {
  if (!shelves.length) return "";
  if (!wrapper || !wrapper.includes("##")) return shelves.join(separator);
  return shelves.map((s) => wrapper.replace(/##/g, s)).join(separator);
}

// Cache compiled regexes so we don't recompile on every highlight × variable.
const VAR_REGEX_CACHE = new Map<string, RegExp>();
function varRegex(key: string): RegExp {
  let re = VAR_REGEX_CACHE.get(key);
  if (!re) {
    re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    VAR_REGEX_CACHE.set(key, re);
  }
  return re;
}

function applyVars(template: string, vars: Record<string, string>): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    const re = varRegex(k);
    // Bug 4 fix: if substituting into a line that starts with "> ", prefix every
    // continuation line of a multiline value with "> " as well.
    s = s.replace(re, (_match, offset) => {
      if (!v.includes("\n")) return v;
      const lineStart = s.lastIndexOf("\n", offset - 1) + 1;
      const prefix = /^>\s/.test(s.slice(lineStart)) ? "> " : "";
      if (!prefix) return v;
      return v.split("\n").join("\n" + prefix);
    });
  }
  return s;
}

/**
 * Bug 3 fix: normalise leading whitespace on continuation lines of highlight text.
 * The first line is left untouched. Each subsequent line that has leading
 * whitespace has it collapsed to a single character (the first char of that run),
 * preserving the type (space vs tab) but eliminating the excess quantity.
 */
function normaliseHighlightText(text: string): string {
  return text
    .split("\n")
    .map((line, i) => {
      if (i === 0) return line;
      const match = line.match(/^(\s+)/);
      if (!match) return line;
      return match[1][0] + line.trimStart();
    })
    .join("\n");
}

function applyVarsMultiline(
  template: string,
  vars: Record<string, string>,
  omitEmptyLines: boolean
): string {
  const processed = preprocessConditionals(template, vars);
  return processed
    .split("\n")
    .map((line) => {
      if (omitEmptyLines) {
        if (line.trim() === "") return null;
        const varTokens = [...line.matchAll(/\{\{([^}]+)\}\}/g)];
        if (varTokens.length > 0) {
          const allEmpty = varTokens.every(([, key]) => (vars[key] ?? "") === "");
          if (allEmpty) return null;
        }
      }
      return applyVars(line, vars);
    })
    .filter((line): line is string => line !== null)
    .join("\n");
}

// -- Date helpers --------------------------------------------------------------

function isoDate(d: Date): string {
  try {
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function formatDate(dateStr: string, settings?: KoboImporterSettings): string {
  const fmt = settings?.dateFormat ?? "YYYY-MM-DD";
  const m = moment(dateStr);
  return m.isValid() ? m.format(fmt) : dateStr;
}

function fmEscape(s: string): string {
  return s.replace(/\r?\n/g, " ").replace(/"/g, '\\"').trim();
}
