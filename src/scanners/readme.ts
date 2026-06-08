import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface ReadmeInfo {
  exists: boolean;
  title: string;
  description: string;
  rawContent: string;
}

export function extractReadme(rootDir: string): ReadmeInfo {
  const readmeNames = ['README.md', 'readme.md', 'README.MD', 'Readme.md'];
  let readmePath = '';

  for (const name of readmeNames) {
    const path = join(rootDir, name);
    if (existsSync(path)) {
      readmePath = path;
      break;
    }
  }

  if (!readmePath) {
    return { exists: false, title: '', description: '', rawContent: '' };
  }

  const content = readFileSync(readmePath, 'utf-8');
  const title = extractTitle(content);
  const description = extractDescription(content);

  return { exists: true, title, description, rawContent: content };
}

function extractTitle(content: string): string {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();

  const firstLine = content.trim().split('\n')[0];
  return firstLine?.replace(/^#+\s*/, '').trim() || '';
}

function extractDescription(content: string): string {
  const lines = content.split('\n');
  const descriptionLines: string[] = [];
  let foundTitle = false;

  for (const line of lines) {
    if (!foundTitle) {
      if (line.match(/^#/)) {
        foundTitle = true;
      }
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) break;
    if (trimmed.startsWith('![')) continue; // skip images
    if (trimmed.startsWith('[!')) continue; // skip badges

    descriptionLines.push(trimmed);
    if (descriptionLines.length >= 3) break;
  }

  return descriptionLines.join(' ').slice(0, 300);
}
