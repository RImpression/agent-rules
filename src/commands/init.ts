import { join } from 'node:path';
import prompts from 'prompts';
import { detectProjectType } from '../scanners/project-type.js';
import { extractTechStack } from '../scanners/tech-stack.js';
import { scanDirectory } from '../scanners/directory.js';
import { extractScripts } from '../scanners/scripts.js';
import { extractReadme } from '../scanners/readme.js';
import { generateAgentsMd } from '../templates/base/agents-md.js';
import { generateRuleMd } from '../templates/base/rule-md.js';
import { generateOverviewMd } from '../templates/base/overview-md.js';
import { generateGlossaryMd } from '../templates/base/glossary-md.js';
import { generateProjectContextSkillMd } from '../templates/base/skill-md.js';
import { generateCodeStandardsMd } from '../templates/base/code-standards-md.js';
import { generateAgentCapabilitiesMd } from '../templates/base/agent-capabilities-md.js';
import { writeFileWithCheck } from '../utils/fs.js';
import { logger } from '../utils/logger.js';
import { parsePlatformList } from '../platforms/index.js';
import type { PlatformConfig } from '../platforms/index.js';
import type { WriteFileResult } from '../utils/fs.js';

interface InitOptions {
  force?: boolean;
  merge?: boolean;
  template?: string;
  dryRun?: boolean;
  platform?: string;
}

export async function initCommand(options: InitOptions): Promise<void> {
  const rootDir = process.cwd();

  logger.heading('arules init — Generating AI specifications');
  logger.info(`Working directory: ${rootDir}`);

  // Step 1: Detect project type
  const projectTypeResult = detectProjectType(rootDir);
  const effectiveType = options.template === 'auto' || !options.template
    ? projectTypeResult.type
    : options.template;

  logger.info(`Detected project: ${projectTypeResult.framework || projectTypeResult.type} (${projectTypeResult.language})`);
  logger.info(`Package manager: ${projectTypeResult.packageManager || 'none detected'}`);

  // Step 2: Scan project
  const [techStack, sourceStructure, devScripts, readmeInfo] = await Promise.all([
    extractTechStack(rootDir),
    scanDirectory(rootDir),
    extractScripts(rootDir),
    extractReadme(rootDir),
  ]);

  const projectName = readmeInfo.title || getProjectNameFromDir(rootDir);
  const projectDescription = readmeInfo.description || '';

  logger.info(`Project name: ${projectName}`);
  logger.info(`Total files: ${sourceStructure.totalFiles}`);

  // Step 3: Check if .agents/ already exists and handle conflicts
  const agentsDir = join(rootDir, '.agents');
  const agentsMdPath = join(rootDir, 'AGENTS.md');
  const hasExisting = await checkExistingFiles(agentsDir, agentsMdPath);

  if (hasExisting && !options.force && !options.merge) {
    const response = await prompts({
      type: 'select',
      name: 'strategy',
      message: '.agents/ directory already exists. How to proceed?',
      choices: [
        { title: 'Merge (keep existing, add missing)', value: 'merge' },
        { title: 'Skip existing files', value: 'skip' },
        { title: 'Overwrite all', value: 'force' },
        { title: 'Cancel', value: 'cancel' },
      ],
    });

    if (response.strategy === 'cancel' || !response.strategy) {
      logger.warn('Cancelled.');
      return;
    }

    if (response.strategy === 'force') options.force = true;
    if (response.strategy === 'merge') options.merge = true;
  }

  // Step 4: Generate and write files
  const writeOptions = { force: options.force, merge: options.merge };
  const results: WriteFileResult[] = [];

  const filesToGenerate: Array<{ path: string; content: string }> = [
    {
      path: agentsMdPath,
      content: generateAgentsMd(projectName),
    },
    {
      path: join(agentsDir, 'rules', 'rule.md'),
      content: generateRuleMd(effectiveType),
    },
    {
      path: join(agentsDir, 'rules', 'project-context', 'code-standards.md'),
      content: generateCodeStandardsMd(projectTypeResult.type, projectTypeResult.framework),
    },
    {
      path: join(agentsDir, 'rules', 'project-context', 'agent-capabilities.md'),
      content: generateAgentCapabilitiesMd(projectTypeResult.type, techStack),
    },
    {
      path: join(agentsDir, 'overviews', 'overview.md'),
      content: generateOverviewMd({
        projectName,
        projectDescription,
        techStack,
        sourceStructure,
        devScripts,
      }),
    },
    {
      path: join(agentsDir, 'overviews', 'glossary.md'),
      content: generateGlossaryMd(projectName),
    },
    {
      path: join(agentsDir, 'skills', 'project-context', 'SKILL.md'),
      content: generateProjectContextSkillMd(),
    },
  ];

  // Step 5: Add platform config files if --platform is specified
  if (options.platform) {
    try {
      const platforms = parsePlatformList(options.platform);
      for (const platform of platforms) {
        filesToGenerate.push({
          path: join(rootDir, platform.filePath),
          content: platform.generateContent(projectName),
        });
      }
      logger.info(`Platform configs: ${platforms.map((p: PlatformConfig) => p.displayName).join(', ')}`);
    } catch (error) {
      logger.error((error as Error).message);
      process.exit(1);
    }
  }

  logger.heading('Writing files');

  if (options.dryRun) {
    for (const file of filesToGenerate) {
      const relativePath = file.path.replace(rootDir + '/', '');
      logger.dryRun(`Would write: ${relativePath}`);
    }
    logger.info('Dry run complete. No files were written.');
    return;
  }

  for (const file of filesToGenerate) {
    const result = writeFileWithCheck(file.path, file.content, writeOptions);
    results.push(result);
    const relativePath = result.path.replace(rootDir + '/', '');
    logger.file(result.action, relativePath);
  }

  // Summary
  const created = results.filter((r) => r.action === 'created').length;
  const skipped = results.filter((r) => r.action === 'skipped').length;
  const overwritten = results.filter((r) => r.action === 'overwritten').length;
  const merged = results.filter((r) => r.action === 'merged').length;

  logger.heading('Summary');
  if (created > 0) logger.success(`${created} file(s) created`);
  if (skipped > 0) logger.warn(`${skipped} file(s) skipped (already exist)`);
  if (overwritten > 0) logger.warn(`${overwritten} file(s) overwritten`);
  if (merged > 0) logger.success(`${merged} file(s) merged`);

  logger.info('');
  logger.info('Next steps:');
  logger.info('  1. Run `arules setup-skill` to install the AI enhancement Skill');
  logger.info('  2. Tell your AI: "补充规范" to intelligently fill glossary & rules');
  logger.info('  3. Run `arules doctor` to check completeness');
}

async function checkExistingFiles(agentsDir: string, agentsMdPath: string): Promise<boolean> {
  const { existsSync } = await import('node:fs');
  return existsSync(agentsDir) || existsSync(agentsMdPath);
}

function getProjectNameFromDir(rootDir: string): string {
  const parts = rootDir.replace(/\\/g, '/').split('/');
  return parts[parts.length - 1] || 'project';
}
