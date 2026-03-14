/**
 * deploy.mjs
 *
 * Copies the built plugin files into your Obsidian vault's plugin folder.
 * Edit VAULT_PATH below, then run: npm run deploy
 *
 * Usage:
 *   node deploy.mjs
 *   npm run deploy
 */

import fs from "fs";
import path from "path";

// -----------------------------------------------
// Option A (manual): paste your vault path here, then run: npm run deploy
//   Windows:   C:\\Users\\YourName\\Documents\\MyVault
//   Mac/Linux: /Users/YourName/Documents/MyVault
// Option B (automated): run setup.bat — it sets KOBO_VAULT for you.
// -----------------------------------------------
const VAULT_PATH = process.env.KOBO_VAULT ?? "";
// -----------------------------------------------

const PLUGIN_ID = "kobo-highlights-2-obsidian";
const FILES_TO_COPY = ["main.js", "manifest.json", "sql-wasm.wasm"];

function main() {
  if (!VAULT_PATH || VAULT_PATH.trim() === "") {
    console.error([
      "",
      "ERROR: No vault path set.",
      "",
      "Option A — run setup.bat (Windows) and it will ask for your vault path.",
      "Option B — open deploy.mjs and set VAULT_PATH at the top of the file.",
      "",
      "Examples:",
      "  Windows:   C:\\\\Users\\\\YourName\\\\Documents\\\\MyVault",
      "  Mac/Linux: /Users/YourName/Documents/MyVault",
      "",
    ].join("\n"));
    process.exit(1);
  }

  const pluginDest = path.join(VAULT_PATH, ".obsidian", "plugins", PLUGIN_ID);

  if (!fs.existsSync(VAULT_PATH)) {
    console.error(`ERROR: Vault path not found: ${VAULT_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(pluginDest)) {
    fs.mkdirSync(pluginDest, { recursive: true });
    console.log(`Created plugin folder: ${pluginDest}`);
  }

  const missing = FILES_TO_COPY.filter((f) => !fs.existsSync(f));
  if (missing.length > 0) {
    console.error([
      "",
      `ERROR: Missing build output files: ${missing.join(", ")}`,
      "",
      "Run 'npm run build' first, then deploy.",
      "",
    ].join("\n"));
    process.exit(1);
  }

  let copied = 0;
  for (const file of FILES_TO_COPY) {
    const dest = path.join(pluginDest, file);
    fs.copyFileSync(file, dest);
    const size = (fs.statSync(dest).size / 1024).toFixed(1);
    console.log(`  OK  ${file} -> ${dest} (${size} KB)`);
    copied++;
  }

  console.log([
    "",
    `Deployed ${copied} files to:`,
    `  ${pluginDest}`,
    "",
    "In Obsidian: reload the plugin via Settings -> Community Plugins,",
    "or use the command 'Reload app without saving' (Ctrl/Cmd+R).",
    "",
  ].join("\n"));
}

main();
