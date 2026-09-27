import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const limit = 500;
const root = resolve(process.argv[2] ?? '.');
const codeFile = /\.(?:[cm]?js|[cm]?ts|jsx|tsx|html|css)$/i;
const sourceDirectories = ['app', 'src', 'tests', 'scripts'];

function countLines(contents) {
  if (contents.length === 0) return 0;
  const breaks = contents.match(/\n/g)?.length ?? 0;
  return breaks + (contents.endsWith('\n') ? 0 : 1);
}

function checkFile(path) {
  const lines = countLines(readFileSync(path, 'utf8'));
  if (lines <= limit) return;
  console.error(`${relative(root, path).replaceAll('\\', '/')}: ${lines} lines (limit: ${limit})`);
  process.exitCode = 1;
}

function checkDirectory(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (entry.isDirectory()) checkDirectory(child);
    else if (entry.isFile() && codeFile.test(entry.name)) checkFile(child);
  }
}

for (const entry of readdirSync(root, { withFileTypes: true })) {
  const path = join(root, entry.name);
  if (entry.isDirectory() && sourceDirectories.includes(entry.name)) checkDirectory(path);
  else if (entry.isFile() && (codeFile.test(entry.name) || ['package.json', 'tsconfig.json'].includes(entry.name))) checkFile(path);
}
