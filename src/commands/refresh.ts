import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { extractTechStack } from '../scanners/tech-stack.js';
import { scanDirectory } from '../scanners/directory.js';
import { extractScripts } from '../scanners/scripts.js';
import { extractReadme } from '../scanners/readme.js';
import { generateOverviewMd } from '../templates/base/overview-md.js';
import { logger } from '../utils/logger.js';
import { ensureDir } from '../utils/fs.js';

interface RefreshOptions {
  full?: boolean;
}

export async function refreshCommand(options: RefreshOptions): Promise<void> {
  const rootDir = process.cwd();
  const agentsDir = join(rootDir, '.agents');

  if (!existsSync(agentsDir)) {
    logger.error('.agents/ directory not found. Run `arules init` first.');
    process.exit(1);
  }

  logger.heading('arules refresh — Updating project specifications');

  // Re-scan project
  const [techStack, sourceStructure, devScripts, readmeInfo] = await Promise.all([
    extractTechStack(rootDir),
    scanDirectory(rootDir),
    extractScripts(rootDir),
    extractReadme(rootDir),
  ]);

  const projectName = readmeInfo.title || getProjectNameFromDir(rootDir);
  const projectDescription = readmeInfo.description || '';

  // Update overview.md
  const overviewPath = join(agentsDir, 'overviews', 'overview.md');
  const newOverview = generateOverviewMd({
    projectName,
    projectDescription,
    techStack,
    sourceStructure,
    devScripts,
  });

  ensureDir(join(agentsDir, 'overviews'));
  writeFileSync(overviewPath, newOverview, 'utf-8');
  logger.success('Updated: .agents/overviews/overview.md');

  // Check glossary for stale paths
  const glossaryPath = join(agentsDir, 'overviews', 'glossary.md');
  if (existsSync(glossaryPath)) {
    const staleCount = checkGlossaryStalePaths(glossaryPath, rootDir);
    if (staleCount > 0) {
      logger.warn(`Found ${staleCount} potentially stale path(s) in glossary.md`);
    } else {
      logger.success('glossary.md paths are all valid');
    }
  }

  // Full mode: scan for new/removed top-level modules
  if (options.full) {
    await refreshModuleMaps(agentsDir, rootDir, sourceStructure.srcDirs);
  }

  logger.heading('Refresh complete');
  logger.info(`Project: ${projectName}`);
  logger.info(`Files detected: ${sourceStructure.totalFiles}`);
  logger.info(`Source dirs: ${sourceStructure.srcDirs.join(', ') || 'none'}`);
}

function checkGlossaryStalePaths(glossaryPath: string, rootDir: string): number {
  const content = readFileSync(glossaryPath, 'utf-8');
  const pathPattern = /`(src\/[^`]+)`/g;
  let staleCount = 0;
  let match: RegExpExecArray | null;

  while ((match = pathPattern.exec(content)) !== null) {
    const refPath = join(rootDir, match[1]);
    if (!existsSync(refPath)) {
      logger.warn(`  Stale path in glossary: ${match[1]}`);
      staleCount++;
    }
  }

  return staleCount;
}

async function refreshModuleMaps(agentsDir: string, rootDir: string, srcDirs: string[]): Promise<void> {
  logger.info('');
  logger.info('Checking module maps...');

  const overviewsDir = join(agentsDir, 'overviews');
  if (!existsSync(overviewsDir)) return;

  // Find existing module-map files
  const fg = (await import('fast-glob')).default;
  const existingMaps = await fg(['*/module-map.md'], { cwd: overviewsDir });
  const mappedModules = existingMaps.map((path) => path.split('/')[0]);

  // Detect actual top-level source directories
  const actualModules: string[] = [];
  for (const srcDir of srcDirs) {
    const srcPath = join(rootDir, srcDir);
    if (!existsSync(srcPath)) continue;

    const subdirs = await fg(['*/'], { cwd: srcPath, onlyDirectories: true, deep: 1 });
    for (const subdir of subdirs) {
      actualModules.push(subdir.replace(/\/$/, ''));
    }
  }

  // Report new modules without maps
  const unmapped = actualModules.filter((mod) => !mappedModules.includes(mod));
  if (unmapped.length > 0) {
    logger.info(`  New modules without module-map (${unmapped.length}):`);
    for (const mod of unmapped.slice(0, 10)) {
      logger.info(`    - ${mod}`);
    }
    if (unmapped.length > 10) {
      logger.info(`    ... and ${unmapped.length - 10} more`);
    }
    logger.info('  Use `arules add module <name>` to create module maps.');
  } else {
    logger.success('All detected modules have module-maps');
  }

  // Report maps for removed modules
  const removed = mappedModules.filter((mod) => !actualModules.includes(mod));
  if (removed.length > 0) {
    logger.warn(`  Module maps for removed modules: ${removed.join(', ')}`);
  }
}

function getProjectNameFromDir(rootDir: string): string {
  const parts = rootDir.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || 'project';
}
