/**
 * deploy.mjs
 *
 * Copies the built plugin files into your Obsidian vault's plugin folder.
 * Run: npm run deploy (vault path read from .vault-path or KOBO_VAULT env var)
 *
 * Usage:
 *   node deploy.mjs
 *   npm run deploy
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Vault path resolution (highest priority first):
//   1. KOBO_VAULT environment variable
//   2. .vault-path file in project root (one line, gitignored)
//   3. Error with setup instructions
function resolveVaultPath() {
  if (process.env.KOBO_VAULT) return process.env.KOBO_VAULT;
  const configFile = path.join(path.dirname(fileURLToPath(import.meta.url)), ".vault-path");
  if (fs.existsSync(configFile)) return fs.readFileSync(configFile, "utf-8").trim();
  return "";
}
const VAULT_PATH = resolveVaultPath();

const PLUGIN_ID = "kobo-highlights-2-obsidian";
const FILES_TO_COPY = ["main.js", "manifest.json", "sql-wasm.wasm"];

function main() {
  if (!VAULT_PATH || VAULT_PATH.trim() === "") {
    console.error([
      "",
      "ERROR: No vault path set.",
      "",
      "Option A: set the KOBO_VAULT environment variable to your vault path.",
      "Option B: create a .vault-path file in the project root containing your vault path (one line).",
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
