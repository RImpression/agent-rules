import { join } from 'node:path';
import prompts from 'prompts';
import { ALL_PLATFORMS, parsePlatformList } from '../platforms/index.js';
import type { PlatformConfig } from '../platforms/index.js';
import { writeFileWithCheck, readProjectFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import type { WriteFileResult } from '../utils/fs.js';

interface SyncOptions {
  platform?: string;
  force?: boolean;
  dryRun?: boolean;
  clean?: boolean;
}

export async function syncCommand(options: SyncOptions): Promise<void> {
  const rootDir = process.cwd();

  logger.heading('arules sync — Sync platform configurations');

  // Verify AGENTS.md exists
  const agentsMdContent = readProjectFile(rootDir, 'AGENTS.md');
  if (!agentsMdContent) {
    logger.error('AGENTS.md not found. Run `arules init` first.');
    process.exit(1);
  }

  // Extract project name from AGENTS.md
  const projectName = extractProjectName(agentsMdContent, rootDir);

  // Handle --clean: remove all platform config files
  if (options.clean) {
    await cleanPlatformFiles(rootDir, options.platform);
    return;
  }

  // Determine which platforms to sync
  let platforms: PlatformConfig[];

  if (options.platform) {
    try {
      platforms = parsePlatformList(options.platform);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    }
  } else {
    // Interactive selection
    const response = await prompts({
      type: 'multiselect',
      name: 'platforms',
      message: 'Select platforms to generate config files for:',
      choices: ALL_PLATFORMS.map((platform) => ({
        title: `${platform.displayName} (${platform.filePath})`,
        value: platform.name,
        selected: false,
      })),
      min: 1,
      hint: 'Space to select, Enter to confirm',
    });

    if (!response.platforms || response.platforms.length === 0) {
      logger.warn('No platforms selected. Cancelled.');
      return;
    }

    platforms = response.platforms.map(
      (name: string) => ALL_PLATFORMS.find((p) => p.name === name)!,
    );
  }

  logger.info(`Syncing ${platforms.length} platform(s): ${platforms.map((p) => p.displayName).join(', ')}`);

  // Generate and write platform files
  const writeOptions = { force: options.force };
  const results: WriteFileResult[] = [];

  for (const platform of platforms) {
    const filePath = join(rootDir, platform.filePath);
    const content = platform.generateContent(projectName);

    if (options.dryRun) {
      logger.dryRun(`Would write: ${platform.filePath}`);
      continue;
    }

    const result = writeFileWithCheck(filePath, content, writeOptions);
    results.push(result);
    logger.file(result.action, platform.filePath);
  }

  if (options.dryRun) {
    logger.info('Dry run complete. No files were written.');
    return;
  }

  // Summary
  const created = results.filter((r) => r.action === 'created').length;
  const skipped = results.filter((r) => r.action === 'skipped').length;
  const overwritten = results.filter((r) => r.action === 'overwritten').length;

  logger.heading('Summary');
  if (created > 0) logger.success(`${created} platform config(s) created`);
  if (skipped > 0) logger.warn(`${skipped} platform config(s) skipped (already exist, use --force to overwrite)`);
  if (overwritten > 0) logger.warn(`${overwritten} platform config(s) overwritten`);
}

function extractProjectName(agentsMdContent: string, rootDir: string): string {
  const headingMatch = agentsMdContent.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  const parts = rootDir.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || 'project';
}

async function cleanPlatformFiles(rootDir: string, platformFilter?: string): Promise<void> {
  const { existsSync, unlinkSync } = await import('node:fs');

  let platforms: PlatformConfig[];
  if (platformFilter) {
    try {
      platforms = parsePlatformList(platformFilter);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    }
  } else {
    platforms = [...ALL_PLATFORMS];
  }

  let removed = 0;
  for (const platform of platforms) {
    const filePath = join(rootDir, platform.filePath);
    if (existsSync(filePath)) {
      unlinkSync(filePath);
      logger.file('removed', platform.filePath);
      removed++;
    }
  }

  if (removed === 0) {
    logger.info('No platform config files found to remove.');
  } else {
    logger.success(`${removed} platform config(s) removed.`);
  }
}
