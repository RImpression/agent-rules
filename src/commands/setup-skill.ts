import { existsSync, readFileSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { logger } from '../utils/logger.js';

interface SetupSkillOptions {
  global?: boolean;
  local?: boolean;
}

export async function setupSkillCommand(options: SetupSkillOptions): Promise<void> {
  const installLocal = options.local || (!options.global && !options.local);
  const installGlobal = options.global;

  logger.heading('arules setup-skill — Installing AI enhancement Skill');

  const skillSourcePath = getSkillSourcePath();
  if (!existsSync(skillSourcePath)) {
    logger.error(`Skill template not found at: ${skillSourcePath}`);
    process.exit(1);
  }

  const skillContent = readFileSync(skillSourcePath, 'utf-8');

  if (installLocal) {
    installSkillLocally(skillContent);
  }

  if (installGlobal) {
    installSkillGlobally(skillContent);
  }

  logger.heading('Setup complete');
  logger.info('The "agent-rules-enhance" Skill is now available.');
  logger.info('Trigger it by saying: "初始化规范", "补充规范", or "分析项目结构"');
}

function installSkillLocally(skillContent: string): void {
  const rootDir = process.cwd();
  const agentsDir = join(rootDir, '.agents');

  if (!existsSync(agentsDir)) {
    logger.warn('.agents/ directory not found. Run `arules init` first to create the scaffold.');
    logger.info('Installing Skill anyway...');
  }

  const skillDir = join(agentsDir, 'skills', 'agent-rules-enhance');
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, 'SKILL.md'), skillContent, 'utf-8');
  logger.success(`Installed locally: .agents/skills/agent-rules-enhance/SKILL.md`);
}

function installSkillGlobally(skillContent: string): void {
  const globalSkillDir = getGlobalSkillDir();
  const targetDir = join(globalSkillDir, 'agent-rules-enhance');

  mkdirSync(targetDir, { recursive: true });
  writeFileSync(join(targetDir, 'SKILL.md'), skillContent, 'utf-8');
  logger.success(`Installed globally: ${targetDir}/SKILL.md`);
  logger.info('Global skills are available across all projects.');
}

function getGlobalSkillDir(): string {
  const home = homedir();

  // Support multiple AI tool conventions
  const candidates = [
    join(home, '.agents', 'skills'),       // Generic convention
    join(home, '.aone_copilot', 'skills'), // Aone Copilot
  ];

  for (const candidate of candidates) {
    if (existsSync(dirname(candidate))) {
      return candidate;
    }
  }

  // Default to generic convention
  return candidates[0];
}

function getSkillSourcePath(): string {
  // Resolve relative to this compiled file's location in dist/
  const currentFileUrl = import.meta.url;
  const currentFilePath = new URL(currentFileUrl).pathname;
  const distDir = dirname(currentFilePath);

  // Try bundled location first (in dist alongside index.js)
  const bundledPath = join(distDir, '..', 'src', 'skill-template', 'SKILL.md');
  if (existsSync(bundledPath)) return bundledPath;

  // Try relative to project root (during development)
  const devPath = join(distDir, '..', 'skill-template', 'SKILL.md');
  if (existsSync(devPath)) return devPath;

  // Fallback: look for it relative to cwd (package root)
  const packageRoot = findPackageRoot(distDir);
  return join(packageRoot, 'src', 'skill-template', 'SKILL.md');
}

function findPackageRoot(startDir: string): string {
  let dir = startDir;
  while (dir !== '/') {
    if (existsSync(join(dir, 'package.json'))) return dir;
    dir = dirname(dir);
  }
  return startDir;
}
