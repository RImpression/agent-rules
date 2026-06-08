import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

export interface WriteFileResult {
  path: string;
  action: 'created' | 'skipped' | 'overwritten' | 'merged';
}

export function ensureDir(dirPath: string): void {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

export function writeFileWithCheck(
  filePath: string,
  content: string,
  options: { force?: boolean; merge?: boolean },
): WriteFileResult {
  ensureDir(dirname(filePath));

  if (existsSync(filePath)) {
    if (options.force) {
      writeFileSync(filePath, content, 'utf-8');
      return { path: filePath, action: 'overwritten' };
    }

    if (options.merge) {
      const existing = readFileSync(filePath, 'utf-8');
      const merged = mergeContent(existing, content);
      writeFileSync(filePath, merged, 'utf-8');
      return { path: filePath, action: 'merged' };
    }

    return { path: filePath, action: 'skipped' };
  }

  writeFileSync(filePath, content, 'utf-8');
  return { path: filePath, action: 'created' };
}

/**
 * Merge strategy: keep existing user content, append new sections that don't exist.
 * Identifies sections by markdown headings (## / ###).
 */
function mergeContent(existing: string, incoming: string): string {
  const existingSections = extractSectionHeadings(existing);
  const incomingLines = incoming.split('\n');

  const newSections: string[] = [];
  let currentSection: string[] = [];
  let currentHeading = '';
  let isNewSection = false;

  for (const line of incomingLines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      // Flush previous section if it was new
      if (isNewSection && currentSection.length > 0) {
        newSections.push(currentSection.join('\n'));
      }
      currentHeading = headingMatch[2].trim();
      currentSection = [line];
      isNewSection = !existingSections.has(currentHeading);
    } else {
      currentSection.push(line);
    }
  }

  // Flush last section
  if (isNewSection && currentSection.length > 0) {
    newSections.push(currentSection.join('\n'));
  }

  if (newSections.length === 0) {
    return existing;
  }

  return existing.trimEnd() + '\n\n' + newSections.join('\n\n') + '\n';
}

function extractSectionHeadings(content: string): Set<string> {
  const headings = new Set<string>();
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      headings.add(match[2].trim());
    }
  }
  return headings;
}

export function fileExists(filePath: string): boolean {
  return existsSync(filePath);
}

export function readProjectFile(rootDir: string, relativePath: string): string | null {
  const fullPath = join(rootDir, relativePath);
  if (!existsSync(fullPath)) return null;
  return readFileSync(fullPath, 'utf-8');
}
