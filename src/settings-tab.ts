import { App, AbstractInputSuggest, PluginSettingTab, Setting, SettingGroup, TFolder } from "obsidian";
import KoboPlugin from "./main";
import { DEFAULT_SETTINGS } from "./types";

// WeakMap to store pill-updater functions keyed by the varRefRow's settingEl.
// Replaces the fragile __updatePills expando + previousElementSibling traversal.
const pillUpdaters = new WeakMap<HTMLElement, (v: string) => void>();

// -- Known variable sets -------------------------------------------------------

const VARS_BOOK = [
  "{{title}}", "{{author}}", "{{series}}", "{{series_number}}",
  "{{date_last_read}}", "{{date_last_imported}}", "{{date_note_created}}", "{{collections}}",
];
const VARS_NOTETITLE = [
  "{{title}}", "{{author}}", "{{series}}", "{{series_number}}",
  "{{date_last_read}}", "{{date_last_imported}}", "{{date_note_created}}",
];
const VARS_FRONT = [
  ...VARS_BOOK,
  "{{percent_read}}", "{{highlight_count}}", "{{annotation_count}}",
  "{{isbn}}", "{{publisher}}", "{{language}}",
];
const VARS_HIGHLIGHT = [
  "{{title}}", "{{author}}", "{{series}}", "{{series_number}}",
  "{{date_last_read}}", "{{date_last_imported}}", "{{date_note_created}}", "{{collections}}",
  "{{highlight_text}}", "{{chapter}}", "{{date_highlighted}}", "{{page_percent}}",
  "{{highlight_number}}",
];
const VARS_ANNOTATION = [
  "{{title}}", "{{author}}", "{{series}}", "{{series_number}}",
  "{{date_last_read}}", "{{date_last_imported}}", "{{date_note_created}}",
  "{{annotation_text}}", "{{chapter}}", "{{date_annotated}}", "{{page_percent}}",
];
const VARS_HEADING       = VARS_FRONT;
const VARS_FOOTER        = VARS_FRONT;
const VARS_APPEND_HEADING = VARS_FRONT;

const PAGE_PERCENT_VAR  = "{{page_percent}}";
const PAGE_PERCENT_WARN =
  "Page percent returns the highlight location as a percentage. Ebooks don't have consistent page numbers.";

// -- Settings tab --------------------------------------------------------------

export class KoboSettingsTab extends PluginSettingTab {
  plugin: KoboPlugin;

  constructor(app: App, plugin: KoboPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Kobo Highlights 2 Obsidian" });

    // -- Folder location -------------------------------------------------------
    new SettingGroup(containerEl)
      .addSetting((s) => s
        .setName("Book note folder location")
        .setDesc("Folder in your vault where book notes are created.")
        .addText((t) => {
          new FolderSuggest(this.app, t.inputEl);
          t.setPlaceholder("Kobo Highlights")
           .setValue(this.plugin.settings.outputFolder)
           .onChange(async (v) => {
             this.plugin.settings.outputFolder = v.trim() || "Kobo Highlights";
             await this.plugin.saveSettings();
           });
          // Bug 2: AbstractInputSuggest calls focus() in its constructor after
          // display() returns, so setTimeout(0) is too early. A one-shot focus
          // listener catches it whenever it fires and immediately blurs.
          const onFirstFocus = () => {
            t.inputEl.blur();
            t.inputEl.removeEventListener("focus", onFirstFocus);
          };
          t.inputEl.addEventListener("focus", onFirstFocus);
        }));

    // -- Skip single-word highlights -------------------------------------------
    new SettingGroup(containerEl)
      .addSetting((s) => s
        .setName("Skip single-word highlights")
        .setDesc("Filters out one-word highlights, which are usually dictionary lookups.")
        .addToggle((t) => t
          .setValue(this.plugin.settings.minHighlightWords >= 2)
          .onChange(async (v) => {
            this.plugin.settings.minHighlightWords = v ? 2 : 0;
            await this.plugin.saveSettings();
          })));

    // -- Collections item wrapper ----------------------------------------------
    new SettingGroup(containerEl)
      .addSetting((s) => {
        s.setName("Collections item wrapper")
          .setDesc(
            "Wraps each collection name when {{collections}} is used in templates. " +
            "Use ## as a placeholder for the collection name. " +
            "Leave empty for a plain comma list."
          );

        const input = s.controlEl.createEl("input", { type: "text" } as any);
        input.placeholder = "Example: [[##]]";
        input.value = this.plugin.settings.collectionsItemWrapper;
        input.style.width = "12em";

        // Keep controlEl (and the input) pinned to the right even with a long desc
        s.infoEl.style.flexShrink = "1";
        s.controlEl.style.flexShrink = "0";

        s.settingEl.style.flexWrap = "wrap";
        const bottomRow = s.settingEl.createEl("div");
        bottomRow.style.cssText =
          "width:100%; display:flex; justify-content:space-between; align-items:center; margin-top:6px;";

        const warn = bottomRow.createEl("span");
        warn.style.cssText = "font-size:0.85em; color:var(--color-yellow); display:none;";

        const resetBtn = bottomRow.createEl("button");
        resetBtn.textContent = "Reset to default";
        resetBtn.style.cssText = "font-size:0.82em; margin-left:auto; display:none;";

        const showWarn = (msg: string) => {
          warn.textContent = msg;
          warn.style.display = "block";
          input.style.outline = "1px solid var(--color-yellow)";
          input.style.borderColor = "var(--color-yellow)";
        };
        const hideWarn = () => {
          warn.style.display = "none";
          input.style.outline = "";
          input.style.borderColor = "";
        };

        const validate = (value: string) => {
          if (value !== "" && value.trim() === "") {
            showWarn("⚠ Invisible text: This wrapper is not empty!");
          } else if (value.trim() !== "" && !value.includes("##")) {
            showWarn("⚠ ## is required as the collection name placeholder.");
          } else {
            hideWarn();
          }
        };

        // Run on open so any saved invalid state is flagged immediately
        validate(input.value);
        if (input.value !== DEFAULT_SETTINGS.collectionsItemWrapper) resetBtn.style.display = "";

        input.addEventListener("blur", () => validate(input.value));
        input.addEventListener("focus", () => hideWarn());
        input.addEventListener("change", async () => {
          resetBtn.style.display = "";
          this.plugin.settings.collectionsItemWrapper = input.value;
          await this.plugin.saveSettings();
        });

        resetBtn.addEventListener("click", async () => {
          input.value = DEFAULT_SETTINGS.collectionsItemWrapper;
          hideWarn();
          resetBtn.style.display = "none";
          this.plugin.settings.collectionsItemWrapper = DEFAULT_SETTINGS.collectionsItemWrapper;
          await this.plugin.saveSettings();
        });
      });

    // -- Allow overwrite + warning (kept together in one group) ----------------
    // Refs for imperative updates wired to the overwrite toggle
    let overwriteWarnEl: HTMLElement | null = null;
    let appendFooterToggleEl: HTMLElement | null = null;
    let frontmatterOverwriteSentenceEl: HTMLElement | null = null;

    // Allow overwrite — DocumentFragment for two-line description
    const overwriteDesc = document.createDocumentFragment();
    overwriteDesc.createEl("span", {
      text: "Off (default): New highlights are appended and your edits are preserved.",
    });
    overwriteDesc.appendChild(document.createElement("br"));
    overwriteDesc.createEl("span", { text: "On: Notes are fully replaced on every import." });

    const overwriteGroup = new SettingGroup(containerEl);
    overwriteGroup.addSetting((s) => s
      .setName("Allow overwrite")
      .setDesc(overwriteDesc)
      .addToggle((t) => t
        .setValue(this.plugin.settings.allowOverwrite)
        .onChange(async (v) => {
          this.plugin.settings.allowOverwrite = v;
          await this.plugin.saveSettings();
          if (overwriteWarnEl) overwriteWarnEl.style.display = v ? "block" : "none";
          if (appendFooterToggleEl) setDisabled(appendFooterToggleEl, v);
          if (frontmatterOverwriteSentenceEl)
            frontmatterOverwriteSentenceEl.style.display = v ? "none" : "";
        })));

    // Overwrite warning — always in DOM below the toggle, centred
    overwriteGroup.addSetting((s) => {
      s.nameEl.remove();
      s.controlEl.remove();
      const p = s.settingEl.createEl("p");
      p.textContent = "⚠ Importing to existing book notes now permanently deletes any edits!";
      p.style.cssText =
        "color:var(--color-red); font-weight:600; font-size:0.9em; margin:0; text-align:center;";
      s.settingEl.style.setProperty("display", this.plugin.settings.allowOverwrite ? "block" : "none");
      s.settingEl.style.textAlign = "center";
      overwriteWarnEl = s.settingEl;
    });

    // -- Note Name -------------------------------------------------------------
    new SettingGroup(containerEl)
      .setHeading("Note name")
      .addSetting((s) => varRefRow(s, VARS_NOTETITLE))
      .addSetting((s) => {
        s.setName("Note name template");
        templateSingleLine(s, {
          knownVars: VARS_NOTETITLE,
          getValue: () => this.plugin.settings.noteTitleTemplate,
          setValue: async (v) => {
            this.plugin.settings.noteTitleTemplate = v.trim() || DEFAULT_SETTINGS.noteTitleTemplate;
            await this.plugin.saveSettings();
          },
          defaultValue: DEFAULT_SETTINGS.noteTitleTemplate,
          requiredVar: "",
          requiredMessage: "⚠ Note name cannot be empty!",
        });
      })
      .addSetting((s) => invalidCharSetting(s, this.plugin));

    // -- Frontmatter -----------------------------------------------------------
    let frontmatterTextareaEl: HTMLTextAreaElement | null = null;

    new SettingGroup(containerEl)
      .setHeading("Frontmatter")
      .addSetting((s) => varRefRow(s, VARS_FRONT))
      .addSetting((s) => {
        // Build description with a conditionally-hidden overwrite sentence
        const descFrag = document.createDocumentFragment();
        descFrag.createEl("span", {
          text: "YAML written at the top of each note. Leave empty to disable.",
        });
        const overwriteSentence = descFrag.createEl("span", {
          text: " With overwrite off, frontmatter is only written on first import and won't update on subsequent imports.",
        });
        overwriteSentence.style.display = this.plugin.settings.allowOverwrite ? "none" : "";
        frontmatterOverwriteSentenceEl = overwriteSentence;

        s.setName("Frontmatter template").setDesc(descFrag);
        frontmatterTextareaEl = templateTextarea(s, {
          knownVars: VARS_FRONT,
          getValue: () => this.plugin.settings.frontmatterTemplate,
          setValue: async (v) => {
            this.plugin.settings.frontmatterTemplate = v;
            await this.plugin.saveSettings();
          },
          defaultValue: DEFAULT_SETTINGS.frontmatterTemplate,
          rows: 16,
        });
      })
      .addSetting((s) => s
        .setName("Import collections as YAML list")
        .setDesc("When on, the collections: frontmatter key expands to a proper YAML block list — one item per line. When off, {{collections}} renders as a plain comma-separated string.")
        .addToggle((t) => t
          .setValue(this.plugin.settings.collectionsAsListEnabled)
          .onChange(async (v) => {
            this.plugin.settings.collectionsAsListEnabled = v;
            await this.plugin.saveSettings();
          })))
      .addSetting((s) => s
        .setName("Omit lines with fully empty variables")
        .setDesc("If every variable on a line resolves to empty, that line is dropped.")
        .addToggle((t) => t
          .setValue(this.plugin.settings.frontmatterOmitEmptyLines)
          .onChange(async (v) => {
            this.plugin.settings.frontmatterOmitEmptyLines = v;
            await this.plugin.saveSettings();
          })));

    // -- Note Heading ----------------------------------------------------------
    new SettingGroup(containerEl)
      .setHeading("Note heading")
      .addSetting((s) => varRefRow(s, VARS_HEADING))
      .addSetting((s) => {
        s.setName("Note heading template")
          .setDesc("Written after frontmatter, before highlights. Leave empty to disable.");
        templateTextarea(s, {
          knownVars: VARS_HEADING,
          getValue: () => this.plugin.settings.noteHeadingTemplate,
          setValue: async (v) => {
            this.plugin.settings.noteHeadingTemplate = v;
            await this.plugin.saveSettings();
          },
          defaultValue: DEFAULT_SETTINGS.noteHeadingTemplate,
          rows: 10,
        });
      })
      .addSetting((s) => s
        .setName("Omit lines with fully empty variables")
        .setDesc("If every variable on a line resolves to empty, that line is dropped.")
        .addToggle((t) => t
          .setValue(this.plugin.settings.noteHeadingOmitEmptyLines)
          .onChange(async (v) => {
            this.plugin.settings.noteHeadingOmitEmptyLines = v;
            await this.plugin.saveSettings();
          })));

    // -- Highlights ------------------------------------------------------------
    new SettingGroup(containerEl)
      .setHeading("Highlights")
      .addSetting((s) => varRefRow(s, VARS_HIGHLIGHT, PAGE_PERCENT_VAR, PAGE_PERCENT_WARN))
      .addSetting((s) => {
        s.setName("Highlight template");
        templateTextarea(s, {
          knownVars: VARS_HIGHLIGHT,
          getValue: () => this.plugin.settings.highlightTemplate,
          setValue: async (v) => {
            this.plugin.settings.highlightTemplate = v;
            await this.plugin.saveSettings();
          },
          defaultValue: DEFAULT_SETTINGS.highlightTemplate,
          rows: 6,
          requiredVar: "highlight_text",
          requiredMessage: "⚠ {{highlight_text}} is required!",
        });
      })
      .addSetting((s) => s
        .setName("Omit lines with fully empty variables")
        .setDesc("If every variable on a line resolves to empty, that line is dropped.")
        .addToggle((t) => t
          .setValue(this.plugin.settings.highlightOmitEmptyLines)
          .onChange(async (v) => {
            this.plugin.settings.highlightOmitEmptyLines = v;
            await this.plugin.saveSettings();
          })))
      .addSetting((s) => s
        .setName("Highlight sort order")
        .setDesc("Order highlights within each book note.")
        .addDropdown((d) => d
          .addOption("date", "Date highlighted (default)")
          .addOption("position", "Page position")
          .setValue(this.plugin.settings.highlightSortOrder)
          .onChange(async (v) => {
            this.plugin.settings.highlightSortOrder = v as "date" | "position";
            await this.plugin.saveSettings();
          })));

    // -- Annotations -----------------------------------------------------------
    new SettingGroup(containerEl)
      .setHeading("Annotations")
      .addSetting((s) => varRefRow(s, VARS_ANNOTATION, PAGE_PERCENT_VAR, PAGE_PERCENT_WARN))
      .addSetting((s) => {
        s.setName("Annotation template")
          .setDesc("Rendered when a highlight has a note written on the device.");
        templateTextarea(s, {
          knownVars: VARS_ANNOTATION,
          getValue: () => this.plugin.settings.annotationTemplate,
          setValue: async (v) => {
            this.plugin.settings.annotationTemplate = v;
            await this.plugin.saveSettings();
          },
          defaultValue: DEFAULT_SETTINGS.annotationTemplate,
          rows: 4,
          requiredVar: "annotation_text",
          requiredMessage: "⚠ {{annotation_text}} is required!",
        });
      })
      .addSetting((s) => s
        .setName("Omit lines with fully empty variables")
        .setDesc("If every variable on a line resolves to empty, that line is dropped.")
        .addToggle((t) => t
          .setValue(this.plugin.settings.annotationOmitEmptyLines)
          .onChange(async (v) => {
            this.plugin.settings.annotationOmitEmptyLines = v;
            await this.plugin.saveSettings();
          })));

    // -- Chapter Title ---------------------------------------------------------
    new SettingGroup(containerEl)
      .setHeading("Chapter Title")
      .addSetting((s) => s
        .setName("Add letter/number spacing")
        .setDesc("Insert spaces at letter↔digit boundaries in both directions (e.g. ch5Intro → ch 5 Intro).")
        .addToggle((t) => t
          .setValue(this.plugin.settings.chapterAddLetterNumberSpacing)
          .onChange(async (v) => {
            this.plugin.settings.chapterAddLetterNumberSpacing = v;
            await this.plugin.saveSettings();
          })))
      .addSetting((s) => s
        .setName("Strip leading zeros")
        .setDesc("Remove leading zeros from numbers (e.g. 01 → 1).")
        .addToggle((t) => t
          .setValue(this.plugin.settings.chapterStripLeadingZeros)
          .onChange(async (v) => {
            this.plugin.settings.chapterStripLeadingZeros = v;
            await this.plugin.saveSettings();
          })))
      .addSetting((s) => {
        s.setName("Trim words from start")
          .setDesc("Remove first N words from the chapter title (0 = off).")
          .addText((t) => t
            .setValue(String(this.plugin.settings.chapterTrimStartWords))
            .onChange(async (v) => {
              const n = parseInt(v, 10);
              this.plugin.settings.chapterTrimStartWords = isNaN(n) || n < 0 ? 0 : n;
              await this.plugin.saveSettings();
            }));
        s.controlEl.querySelector("input")!.type = "number";
        s.controlEl.querySelector("input")!.min = "0";
        s.controlEl.querySelector("input")!.style.width = "5em";
      })
      .addSetting((s) => {
        s.setName("Trim words from end")
          .setDesc("Remove last N words from the chapter title (0 = off).")
          .addText((t) => t
            .setValue(String(this.plugin.settings.chapterTrimEndWords))
            .onChange(async (v) => {
              const n = parseInt(v, 10);
              this.plugin.settings.chapterTrimEndWords = isNaN(n) || n < 0 ? 0 : n;
              await this.plugin.saveSettings();
            }));
        s.controlEl.querySelector("input")!.type = "number";
        s.controlEl.querySelector("input")!.min = "0";
        s.controlEl.querySelector("input")!.style.width = "5em";
      })
      .addSetting((s) => s
        .setName("Chapter prefix")
        .setDesc("Normalize 'ch'/'chapter' prefix variants.")
        .addDropdown((d) => d
          .addOption("none", "Keep as-is")
          .addOption("strip", "Strip prefix")
          .addOption("Chapter", 'Standardize to "Chapter"')
          .addOption("Ch", 'Standardize to "Ch"')
          .setValue(this.plugin.settings.chapterPrefixNormalization)
          .onChange(async (v) => {
            this.plugin.settings.chapterPrefixNormalization = v as "none" | "strip" | "Chapter" | "Ch";
            await this.plugin.saveSettings();
          })))
      .addSetting((s) => {
        s.setName("Symbols to replace")
          .setDesc("Each character in this string will be replaced. Example: ;,-")
          .addText((t) => t
            .setValue(this.plugin.settings.chapterSymbolsToReplace)
            .onChange(async (v) => {
              this.plugin.settings.chapterSymbolsToReplace = v;
              await this.plugin.saveSettings();
            }));
        s.controlEl.querySelector("input")!.style.width = "8em";
      })
      .addSetting((s) => {
        s.setName("Replace with")
          .setDesc("Replacement string (default: -). Supports multi-char (e.g.  - ). Clear to delete symbols entirely.")
          .addText((t) => t
            .setValue(this.plugin.settings.chapterSymbolReplacement)
            .onChange(async (v) => {
              this.plugin.settings.chapterSymbolReplacement = v;
              await this.plugin.saveSettings();
            }));
        s.controlEl.querySelector("input")!.style.width = "8em";
      });

    // -- Footer ----------------------------------------------------------------
    new SettingGroup(containerEl)
      .setHeading("Footer")
      .addSetting((s) => varRefRow(s, VARS_FOOTER))
      .addSetting((s) => {
        s.setName("Footer template")
          .setDesc("Appended at the bottom of each book note. Leave empty to disable.");
        templateTextarea(s, {
          knownVars: VARS_FOOTER,
          getValue: () => this.plugin.settings.footerTemplate,
          setValue: async (v) => {
            this.plugin.settings.footerTemplate = v;
            await this.plugin.saveSettings();
          },
          defaultValue: DEFAULT_SETTINGS.footerTemplate,
          rows: 4,
        });
      })
      .addSetting((s) => {
        s.setName("Append footer on each import")
          .setDesc("When overwrite is off, re-adds the footer after each batch of new highlights.")
          .addToggle((t) => t
            .setValue(this.plugin.settings.footerAppendOnEachImport)
            .onChange(async (v) => {
              this.plugin.settings.footerAppendOnEachImport = v;
              await this.plugin.saveSettings();
            }));
        appendFooterToggleEl = s.settingEl;
        if (this.plugin.settings.allowOverwrite) setDisabled(s.settingEl, true);
      })
      .addSetting((s) => s
        .setName("Omit lines with fully empty variables")
        .setDesc("If every variable on a line resolves to empty, that line is dropped.")
        .addToggle((t) => t
          .setValue(this.plugin.settings.footerOmitEmptyLines)
          .onChange(async (v) => {
            this.plugin.settings.footerOmitEmptyLines = v;
            await this.plugin.saveSettings();
          })));

    // -- Append heading --------------------------------------------------------
    new SettingGroup(containerEl)
      .setHeading("Append heading")
      .addSetting((s) => varRefRow(s, VARS_APPEND_HEADING))
      .addSetting((s) => {
        s.setName("Append heading template")
          .setDesc(
            "Inserted before each new batch of highlights during a reimport (when overwrite is off). " +
            "Leave empty to append highlights with no heading."
          );
        templateTextarea(s, {
          knownVars: VARS_APPEND_HEADING,
          getValue: () => this.plugin.settings.appendHeadingTemplate,
          setValue: async (v) => {
            this.plugin.settings.appendHeadingTemplate = v;
            await this.plugin.saveSettings();
          },
          defaultValue: DEFAULT_SETTINGS.appendHeadingTemplate,
          rows: 4,
        });
      })
      .addSetting((s) => s
        .setName("Omit lines with fully empty variables")
        .setDesc("If every variable on a line resolves to empty, that line is dropped.")
        .addToggle((t) => t
          .setValue(this.plugin.settings.appendHeadingOmitEmptyLines)
          .onChange(async (v) => {
            this.plugin.settings.appendHeadingOmitEmptyLines = v;
            await this.plugin.saveSettings();
          })));
  }
}

// -- Helpers -------------------------------------------------------------------

/** Grey out a setting row and disable its interactive controls. */
function setDisabled(el: HTMLElement, disabled: boolean) {
  el.style.opacity = disabled ? "0.4" : "";
  el.style.pointerEvents = disabled ? "none" : "";
  el.querySelectorAll("input, button, select, textarea").forEach((c) => {
    (c as HTMLInputElement).disabled = disabled;
  });
}

/**
 * Given a textarea returned by templateTextarea(), look up the pill updater
 * registered for the preceding varRefRow's settingEl.
 */
function getPillUpdaterFor(ta: HTMLTextAreaElement): ((v: string) => void) | null {
  const settingEl = ta.closest(".setting-item") as HTMLElement | null;
  const prev = settingEl?.previousElementSibling as HTMLElement | null;
  return (prev && pillUpdaters.has(prev)) ? pillUpdaters.get(prev)! : null;
}

/**
 * Pill-style variable reference row.
 * Pills highlight to accent colour on blur if that var is used in the
 * associated textarea; revert to muted on next blur if no longer present.
 * If pagePercentVar/pagePercentWarn are supplied, a contextual note is shown
 * below the pills on blur when that var is used.
 * The updater function is stored in pillUpdaters WeakMap keyed by settingEl.
 */
function varRefRow(
  s: Setting,
  vars: string[],
  pagePercentVar?: string,
  pagePercentWarn?: string
): Setting {
  s.nameEl.remove();
  s.controlEl.remove();
  s.settingEl.style.paddingBottom = "4px";

  const container = s.settingEl.createEl("div");
  container.style.cssText = "display:flex; flex-direction:column; gap:4px; width:100%;";

  const wrap = container.createEl("div");
  wrap.style.cssText = "display:flex; flex-wrap:wrap; gap:4px; align-items:center;";

  const pillMap = new Map<string, HTMLElement>();
  for (const v of vars) {
    const pill = wrap.createEl("span");
    pill.textContent = v;
    pill.style.cssText =
      "display:inline-block; font-family:var(--font-monospace); font-size:0.78em; " +
      "color:var(--text-muted); background:var(--background-modifier-border); " +
      "border-radius:4px; padding:1px 6px; line-height:1.6; transition:color 0.15s;";
    pillMap.set(v, pill);
  }

  let pagePercentWarnEl: HTMLElement | null = null;
  if (pagePercentVar && pagePercentWarn) {
    const warnP = container.createEl("p");
    warnP.textContent = pagePercentWarn;
    warnP.style.cssText = "margin:0; font-size:0.8em; color:var(--text-muted); display:none;";
    pagePercentWarnEl = warnP;
  }

  pillUpdaters.set(s.settingEl, (value: string) => {
    const usedVars = new Set(
      [...value.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => `{{${m[1]}}}`)
    );
    for (const [v, pill] of pillMap.entries()) {
      pill.style.color = usedVars.has(v) ? "var(--text-accent)" : "var(--text-muted)";
    }
    if (pagePercentWarnEl) {
      pagePercentWarnEl.style.display = usedVars.has(pagePercentVar!) ? "block" : "none";
    }
  });

  return s;
}

/**
 * Full-width single-line text input for the note name template.
 * Same validation, pill-update, and reset behaviour as templateTextarea.
 */
function templateSingleLine(
  s: Setting,
  opts: {
    knownVars: string[];
    getValue: () => string;
    setValue: (v: string) => Promise<void>;
    defaultValue: string;
    requiredVar?: string;   // raw key e.g. "highlight_text", or "" to mean non-empty
    requiredMessage?: string;
  }
): void {
  s.settingEl.style.flexDirection = "column";
  s.settingEl.style.alignItems = "stretch";
  s.infoEl.style.marginBottom = "8px";
  s.controlEl.style.flexDirection = "column";
  s.controlEl.style.alignItems = "stretch";
  s.controlEl.style.width = "100%";

  const input = s.controlEl.createEl("input", { type: "text" } as any);
  input.value = opts.getValue();
  input.style.cssText =
    "width:100%; box-sizing:border-box; font-family:var(--font-monospace); font-size:0.85em;";

  const bottomRow = s.controlEl.createEl("div");
  bottomRow.style.cssText =
    "display:flex; justify-content:space-between; align-items:center; margin-top:6px;";

  const warn = bottomRow.createEl("span");
  warn.style.cssText = "font-size:0.85em; color:var(--color-yellow); display:none;";

  const resetBtn = bottomRow.createEl("button");
  resetBtn.textContent = "Reset to default";
  resetBtn.style.cssText = "font-size:0.82em; margin-left:auto; display:none;";

  const getPillUpdater = (): ((v: string) => void) | null => {
    const prev = s.settingEl.previousElementSibling as HTMLElement | null;
    return (prev && pillUpdaters.has(prev)) ? pillUpdaters.get(prev)! : null;
  };

  const validate = (value: string) => {
    const found = [...value.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => `{{${m[1]}}}`);
    const unknown = [...new Set(found.filter((v) => !opts.knownVars.includes(v)))];
    const missingRequired = opts.requiredVar !== undefined && (
      opts.requiredVar === ""
        ? value.trim() === ""
        : !found.includes(`{{${opts.requiredVar}}}`)
    );
    if (missingRequired) {
      warn.textContent = opts.requiredMessage!;
      warn.style.display = "block";
      input.style.borderColor = "var(--color-yellow)";
      input.style.outline = "1px solid var(--color-yellow)";
    } else if (unknown.length > 0) {
      warn.textContent = `⚠ Unknown variable${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}`;
      warn.style.display = "block";
      input.style.borderColor = "var(--color-yellow)";
      input.style.outline = "1px solid var(--color-yellow)";
    } else if (value !== "" && value.trim() === "") {
      warn.textContent = "⚠ Invisible text: This template is not empty!";
      warn.style.display = "block";
      input.style.borderColor = "";
      input.style.outline = "";
    } else {
      warn.style.display = "none";
      input.style.borderColor = "";
      input.style.outline = "";
    }
    getPillUpdater()?.(value);
  };

  const clearValidation = () => {
    warn.style.display = "none";
    input.style.borderColor = "";
    input.style.outline = "";
  };

  // Run validation immediately so warnings are visible on open
  validate(input.value);
  if (input.value !== opts.defaultValue) resetBtn.style.display = "";

  input.addEventListener("blur", () => validate(input.value));
  input.addEventListener("change", async () => {
    resetBtn.style.display = "";
    await opts.setValue(input.value);
  });

  resetBtn.addEventListener("click", async () => {
    input.value = opts.defaultValue;
    clearValidation();
    resetBtn.style.display = "none";
    getPillUpdater()?.(opts.defaultValue);
    await opts.setValue(opts.defaultValue);
  });
}

/**
 * Full-width textarea stacked under the setting description.
 * On blur: validates unknown {{vars}}, updates pill highlights in preceding varRefRow.
 * Validation also runs immediately on display so warnings survive close/reopen.
 * Reset button: anchored right, only visible after the user has edited the value.
 * Returns the textarea element so callers can read/write its value directly.
 */
function templateTextarea(
  s: Setting,
  opts: {
    knownVars: string[];
    getValue: () => string;
    setValue: (v: string) => Promise<void>;
    defaultValue: string;
    rows: number;
    requiredVar?: string;   // raw key e.g. "highlight_text"
    requiredMessage?: string;
  }
): HTMLTextAreaElement {
  s.settingEl.style.flexDirection = "column";
  s.settingEl.style.alignItems = "stretch";
  s.infoEl.style.marginBottom = "8px";
  s.controlEl.style.flexDirection = "column";
  s.controlEl.style.alignItems = "stretch";
  s.controlEl.style.width = "100%";

  const ta = s.controlEl.createEl("textarea");
  ta.value = opts.getValue();
  ta.rows = opts.rows;
  ta.style.cssText =
    "width:100%; box-sizing:border-box; font-family:var(--font-monospace); " +
    "font-size:0.85em; resize:vertical;";

  const bottomRow = s.controlEl.createEl("div");
  bottomRow.style.cssText =
    "display:flex; justify-content:space-between; align-items:center; margin-top:6px;";

  const warn = bottomRow.createEl("span");
  warn.style.cssText = "font-size:0.85em; color:var(--color-yellow); display:none;";

  const resetBtn = bottomRow.createEl("button");
  resetBtn.textContent = "Reset to default";
  resetBtn.style.cssText = "font-size:0.82em; margin-left:auto; display:none;";

  const getPillUpdater = (): ((v: string) => void) | null => {
    const prev = s.settingEl.previousElementSibling as HTMLElement | null;
    return (prev && pillUpdaters.has(prev)) ? pillUpdaters.get(prev)! : null;
  };

  const validate = (value: string) => {
    const found = [...value.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => `{{${m[1]}}}`);
    const unknown = [...new Set(found.filter((v) => !opts.knownVars.includes(v)))];
    const missingRequired = opts.requiredVar !== undefined &&
      !found.includes(`{{${opts.requiredVar}}}`);
    if (missingRequired) {
      warn.textContent = opts.requiredMessage!;
      warn.style.display = "block";
      ta.style.borderColor = "var(--color-yellow)";
      ta.style.outline = "1px solid var(--color-yellow)";
    } else if (unknown.length > 0) {
      warn.textContent = `⚠ Unknown variable${unknown.length > 1 ? "s" : ""}: ${unknown.join(", ")}`;
      warn.style.display = "block";
      ta.style.borderColor = "var(--color-yellow)";
      ta.style.outline = "1px solid var(--color-yellow)";
    } else if (value !== "" && value.trim() === "") {
      warn.textContent = "⚠ Invisible text: This template is not empty!";
      warn.style.display = "block";
      ta.style.borderColor = "";
      ta.style.outline = "";
    } else {
      warn.style.display = "none";
      ta.style.borderColor = "";
      ta.style.outline = "";
    }
    getPillUpdater()?.(value);
  };

  const clearValidation = () => {
    warn.style.display = "none";
    ta.style.borderColor = "";
    ta.style.outline = "";
  };

  // Run validation immediately so warnings are visible on open
  validate(ta.value);
  if (ta.value !== opts.defaultValue) resetBtn.style.display = "";

  ta.addEventListener("blur", () => validate(ta.value));
  ta.addEventListener("change", async () => {
    resetBtn.style.display = "";
    await opts.setValue(ta.value);
  });

  resetBtn.addEventListener("click", async () => {
    ta.value = opts.defaultValue;
    clearValidation();
    resetBtn.style.display = "none";
    getPillUpdater()?.(opts.defaultValue);
    await opts.setValue(opts.defaultValue);
  });

  return ta;
}

/**
 * "Replace invalid characters with" setting — input inline in the row,
 * warn + Reset button on a full-width row below.
 */
function invalidCharSetting(s: Setting, plugin: KoboPlugin): void {
  s.setName("Replace invalid characters with")
    .setDesc("Characters not allowed in filenames: : / \\ * ? \" < > |");

  const input = s.controlEl.createEl("input", { type: "text" } as any);
  input.value = plugin.settings.noteTitleInvalidCharReplacement;
  input.style.width = "6em";

  s.settingEl.style.flexWrap = "wrap";
  const bottomRow = s.settingEl.createEl("div");
  bottomRow.style.cssText =
    "width:100%; display:flex; justify-content:space-between; align-items:center; margin-top:6px;";

  const warn = bottomRow.createEl("span");
  warn.style.cssText = "font-size:0.85em; color:var(--color-yellow); display:none;";

  const resetBtn = bottomRow.createEl("button");
  resetBtn.textContent = "Reset to default";
  resetBtn.style.cssText = "font-size:0.82em; margin-left:auto; display:none;";

  const showWarn = (msg: string) => {
    warn.textContent = msg;
    warn.style.display = "block";
    input.style.outline = "1px solid var(--color-yellow)";
    input.style.borderColor = "var(--color-yellow)";
  };
  const hideWarn = () => {
    warn.style.display = "none";
    input.style.outline = "";
    input.style.borderColor = "";
  };

  input.addEventListener("blur", () => {
    if (input.value !== "" && input.value.trim() === "") {
      showWarn("⚠ Invisible text: This replacement is not empty!");
    } else if (input.value.length > 3) {
      showWarn(`⚠ Replacement is ${input.value.length} characters long — note names may become very long.`);
    } else {
      hideWarn();
    }
  });
  input.addEventListener("focus", () => hideWarn());
  input.addEventListener("change", async () => {
    resetBtn.style.display = "";
    plugin.settings.noteTitleInvalidCharReplacement = input.value;
    await plugin.saveSettings();
  });

  resetBtn.addEventListener("click", async () => {
    input.value = DEFAULT_SETTINGS.noteTitleInvalidCharReplacement;
    hideWarn();
    resetBtn.style.display = "none";
    plugin.settings.noteTitleInvalidCharReplacement = DEFAULT_SETTINGS.noteTitleInvalidCharReplacement;
    await plugin.saveSettings();
  });
}

// -- Folder autocomplete -------------------------------------------------------

class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(app: App, inputEl: HTMLInputElement) {
    super(app, inputEl);
  }

  getSuggestions(query: string): TFolder[] {
    const lower = query.toLowerCase();
    return this.app.vault.getAllFolders()
      .filter((f) => f.path.toLowerCase().contains(lower))
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  renderSuggestion(folder: TFolder, el: HTMLElement): void {
    el.textContent = folder.path;
  }

  selectSuggestion(folder: TFolder): void {
    this.setValue(folder.path);
    this.close();
  }
}
