import { KoboBook, KoboHighlight, KoboImporterSettings } from "./types";

// -- Note title / filename -----------------------------------------------------

export function renderFilename(book: KoboBook, settings: KoboImporterSettings): string {
  const importDate = isoDate(new Date());
  const raw = applyVars(settings.noteTitleTemplate, bookVars(book, importDate, importDate, settings));
  const replacement = settings.noteTitleInvalidCharReplacement;
  return raw
    .replace(/[/:*?"<>|\\]/g, replacement)
    .replace(/ {2,}/g, " ")
    .replace(/^\.+|\.+$/g, "")
    .trim() || "Untitled";
}

// -- Full book note ------------------------------------------------------------

export function renderBookNote(book: KoboBook, settings: KoboImporterSettings, createdDate: string): string {
  const importDate = isoDate(new Date());
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
    ...bookVars(book, importDate, createdDate, settings),
    percent_read: String(Math.max(0, Math.min(100, Number(book.percentRead) || 0))),
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
    ...bookVars(book, importDate, createdDate, settings),
    percent_read: String(Math.max(0, Math.min(100, Number(book.percentRead) || 0))),
    highlight_count: String(book.highlightCount),
    annotation_count: String(book.annotationCount),
    isbn: book.isbn ?? "",
    publisher: book.publisher ?? "",
    language: book.language ?? "",
  };

  return applyVarsMultiline(tmpl, vars, settings.noteHeadingOmitEmptyLines);
}

// -- Single highlight ----------------------------------------------------------

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
    ...bookVars(book, importDate, cd, settings),
    highlight_text: normaliseHighlightText(h.text),
    chapter: h.chapter ?? "",
    date_highlighted: formatDate(h.dateCreated),
    page_percent: h.chapterProgress > 0 ? `${Math.round(h.chapterProgress * 100)}%` : "",
    highlight_number: String(index + 1),
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
    ...bookVars(book, importDate, createdDate ?? importDate, settings),
    annotation_text: h.annotation,
    chapter: h.chapter ?? "",
    date_annotated: formatDate(h.dateCreated),
    page_percent: h.chapterProgress > 0 ? `${Math.round(h.chapterProgress * 100)}%` : "",
  };
  return applyVarsMultiline(settings.annotationTemplate, vars, settings.annotationOmitEmptyLines).trim();
}

// -- Footer --------------------------------------------------------------------

function renderFooter(book: KoboBook, settings: KoboImporterSettings, importDate: string, createdDate: string): string {
  const tmpl = settings.footerTemplate.trim();
  if (!tmpl) return "";

  const vars = {
    ...bookVars(book, importDate, createdDate, settings),
    percent_read: String(Math.max(0, Math.min(100, Number(book.percentRead) || 0))),
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
  const importDate = isoDate(new Date());

  const headingVars = {
    ...bookVars(book, importDate, createdDate, settings),
    percent_read: String(Math.max(0, Math.min(100, Number(book.percentRead) || 0))),
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

function bookVars(book: KoboBook, importDate: string, createdDate: string, settings?: KoboImporterSettings): Record<string, string> {
  return {
    title: book.title,
    author: normalizeAuthor(book.author),
    series: book.series ?? "",
    series_number: book.seriesNumber ?? "",
    date_last_read: book.dateLastRead ? isoDate(new Date(book.dateLastRead)) : "",
    date_last_imported: importDate,
    date_note_created: createdDate,
    collections: wrapCollections(book.shelves, settings?.collectionsItemWrapper ?? ""),
  };
}

function normalizeAuthor(raw: string | undefined): string {
  if (!raw) return "";
  return raw.replace(/;\s*/g, ", ").replace(/,\s+/g, ", ").trim();
}

/**
 * Renders a collections list as a comma-separated string, applying the user's
 * item wrapper if set. e.g. wrapper "[[##]]" → "[[Fiction]], [[Non-Fiction]]"
 */
function wrapCollections(shelves: string[], wrapper: string): string {
  if (!shelves.length) return "";
  if (!wrapper || !wrapper.includes("##")) return shelves.join(", ");
  return shelves.map((s) => wrapper.replace(/##/g, s)).join(", ");
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
  return template
    .split("\n")
    .map((line) => {
      if (omitEmptyLines) {
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

function formatDate(dateStr: string): string {
  return isoDate(new Date(dateStr)) || dateStr;
}

function fmEscape(s: string): string {
  return s.replace(/\r?\n/g, " ").replace(/"/g, '\\"').trim();
}
