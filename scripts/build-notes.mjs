import fs from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "src", "generated");
const outputFile = path.join(outputDir, "notes.ts");

const ignoredDirs = new Set([
  ".git",
  "node_modules",
  "dist",
  "src",
  "scripts",
  ".github"
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) {
        continue;
      }

      files.push(...walk(fullPath));
      continue;
    }

    if (!entry.name.endsWith(".md")) {
      continue;
    }

    const content = fs.readFileSync(fullPath, "utf8");
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : entry.name.replace(/\.md$/, "");

    files.push({
      id: relPath.replace(/[^\w\u4e00-\u9fa5-]/g, "-"),
      title,
      path: relPath,
      section: relPath.split(path.sep)[0],
      content
    });
  }

  return files;
}

const notes = walk(rootDir)
  .sort((a, b) => a.path.localeCompare(b.path, "zh-CN"))
  .map((note) => ({
    ...note,
    urlPath: encodeURIComponent(note.path).replace(/%2F/g, "/")
  }));

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  outputFile,
  [
    "export type NoteItem = {",
    "  id: string;",
    "  title: string;",
    "  path: string;",
    "  section: string;",
    "  content: string;",
    "  urlPath: string;",
    "};",
    "",
    `export const notes: NoteItem[] = ${JSON.stringify(notes, null, 2)};`,
    ""
  ].join("\n")
);

console.log(`Generated ${notes.length} notes -> ${path.relative(rootDir, outputFile)}`);
