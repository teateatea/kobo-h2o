// -- Domain types --------------------------------------------------------------

export interface KoboHighlight {
  text: string;
  annotation?: string;
  chapter?: string;
  dateCreated: string;
  chapterProgress: number;
  bookTitle?: string;
  bookAuthor?: string;
  color?: number;
}

export interface KoboBook {
  title: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  language?: string;
  series?: string;
  seriesNumber?: string;
  dateLastRead?: string;
  percentRead: number;
  highlightCount: number;
  annotationCount: number;
  shelves: string[];
  highlights: KoboHighlight[];
}

// -- Settings ------------------------------------------------------------------

export interface KoboImporterSettings {
  // Output
  outputFolder: string;
  minHighlightWords: number;
  allowOverwrite: boolean;
  collectionsItemWrapper: string;
  collectionsItemSeparator: string;

  // Format — Card 1: Note name
  noteTitleTemplate: string;
  noteTitleInvalidCharReplacement: string;

  // Format — Card 2: Frontmatter
  frontmatterTemplate: string;
  frontmatterOmitEmptyLines: boolean;
  collectionsAsListEnabled: boolean;

  // Format — Card 3: Note heading
  noteHeadingTemplate: string;
  noteHeadingOmitEmptyLines: boolean;

  // Format — Card 4: Highlights
  highlightTemplate: string;
  highlightOmitEmptyLines: boolean;

  // Format — Card 5: Annotations
  annotationTemplate: string;
  annotationOmitEmptyLines: boolean;

  // Format — Card 6: Note footer
  footerTemplate: string;
  footerOmitEmptyLines: boolean;
  footerAppendOnEachImport: boolean;

  // Format — Card 7: Append heading
  appendHeadingTemplate: string;
  appendHeadingOmitEmptyLines: boolean;

  // Sort
  highlightSortOrder: "date" | "position";

  // Author & Metadata Formatting
  dateFormat: string;
  authorNameOrder: "as-is" | "first-last" | "last-first";
  authorNameWrapper: string;
  titleCaseFormat: "as-is" | "title-case" | "upper" | "lower";
  percentFormat: "decimal" | "integer" | "percent" | "PCT" | "pct";

  // Chapter Title Cleanup
  chapterAddLetterNumberSpacing: boolean;
  chapterStripLeadingZeros: boolean;
  chapterTrimStartWords: number;
  chapterTrimEndWords: number;
  chapterPrefixNormalization: "none" | "strip" | "Chapter" | "Ch";
  chapterSymbolsToReplace: string;
  chapterSymbolReplacement: string;

  // Highlight Color Mapping
  highlightColorMap: Record<string, string>;
}

export const DEFAULT_SETTINGS: KoboImporterSettings = {
  // Output
  outputFolder: "Kobo Highlights",
  minHighlightWords: 0,
  allowOverwrite: false,
  collectionsItemWrapper: "",
  collectionsItemSeparator: ", ",

  // Format — Card 1: Note name
  noteTitleTemplate: "{{title}} ({{author}})",
  noteTitleInvalidCharReplacement: " -",

  // Format — Card 2: Frontmatter
  frontmatterTemplate: [
    "---",
    "title: {{title}}",
    "author: {{author}}",
    "series: {{series}}",
    "series_number: {{series_number}}",
    "last_read: {{date_last_read}}",
    "percent_read: {{percent_read}}",
    "highlights: {{highlight_count}}",
    "annotations: {{annotation_count}}",
    "isbn: {{isbn}}",
    "publisher: {{publisher}}",
    "language: {{language}}",
    "imported: {{date_last_imported}}",
    "date_note_created: {{date_note_created}}",
    "collections: {{collections}}",
    "---",
  ].join("\n"),
  frontmatterOmitEmptyLines: true,
  collectionsAsListEnabled: true,

  // Format — Card 3: Note heading
  noteHeadingTemplate: [
    "# {{title}}",
    "*by {{author}}*",
    "{{series}}",
    "",
    "{{highlight_count}} highlights — imported {{date_last_imported}}",
    "",
    "---",
    "",
    "## Highlights",
  ].join("\n"),
  noteHeadingOmitEmptyLines: true,

  // Format — Card 4: Highlights
  highlightTemplate: [
    "{{chapter}}",
    "> {{highlight_text}}",
    "",
    "— {{author}}, *{{title}}*",
  ].join("\n"),
  highlightOmitEmptyLines: true,

  // Format — Card 5: Annotations
  annotationTemplate: [
    "*{{annotation_text}}*",
    "— {{date_annotated}}, in {{title}} ({{author}})",
  ].join("\n"),
  annotationOmitEmptyLines: true,

  // Format — Card 6: Note footer
  footerTemplate: "---",
  footerOmitEmptyLines: true,
  footerAppendOnEachImport: false,

  // Format — Card 7: Append heading
  appendHeadingTemplate: "## Highlights from {{date_last_imported}}",
  appendHeadingOmitEmptyLines: true,

  // Sort
  highlightSortOrder: "date",

  // Author & Metadata Formatting
  dateFormat: "YYYY-MM-DD",
  authorNameOrder: "as-is",
  authorNameWrapper: "",
  titleCaseFormat: "as-is",
  percentFormat: "integer",

  // Chapter Title Cleanup
  chapterAddLetterNumberSpacing: false,
  chapterStripLeadingZeros: false,
  chapterTrimStartWords: 0,
  chapterTrimEndWords: 0,
  chapterPrefixNormalization: "none",
  chapterSymbolsToReplace: "",
  chapterSymbolReplacement: "-",

  // Highlight Color Mapping
  highlightColorMap: { yellow: "yellow", red: "red", blue: "blue", green: "green" },
};


