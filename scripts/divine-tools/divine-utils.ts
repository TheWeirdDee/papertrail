import fs from 'node:fs';
import path from 'node:path';

export function resolvePrivatePath(relativePath: string): string {
  return path.join(process.cwd(), 'scripts', 'private', relativePath);
}

export function readCsvLines(filePath: string): string[] {
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).filter((line) => line.trim());
}
