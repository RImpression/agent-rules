import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import fg from 'fast-glob';
import { logger } from '../utils/logger.js';

interface DiagnosticResult {
  passed: number;
  warnings: number;
  errors: number;
}

export async function doctorCommand(): Promise<void> {
  const rootDir = process.cwd();
  const agentsDir = join(rootDir, '.agents');

  logger.heading('arules doctor — Checking specification health');

  if (!existsSync(agentsDir)) {
    logger.error('.agents/ directory not found. Run `arules init` first.');
    process.exit(1);
  }

  const result: DiagnosticResult = { passed: 0, warnings: 0, errors: 0 };

  // Check 1: AGENTS.md exists
  checkFileExists(rootDir, 'AGENTS.md', 'Entry file', result, 'error');

  // Check 2: Core structure
  checkFileExists(agentsDir, 'rules/rule.md', 'Rule index', result, 'error');
  checkFileExists(agentsDir, 'overviews/overview.md', 'Project overview', result, 'error');
  checkFileExists(agentsDir, 'overviews/glossary.md', 'Glossary', result, 'warning');
  checkFileExists(agentsDir, 'skills/project-context/SKILL.md', 'Project context skill', result, 'warning');
  checkFileExists(agentsDir, 'rules/project-context/code-standards.md', 'Code standards', result, 'warning');
  checkFileExists(agentsDir, 'rules/project-context/agent-capabilities.md', 'Agent capabilities', result, 'warning');

  // Check 3: rule.md has trigger: always_on
  checkRuleTrigger(agentsDir, result);

  // Check 4: AGENTS.md references correct paths
  checkAgentsMdReferences(rootDir, result);

  // Check 5: rule.md index references exist
  await checkRuleIndexReferences(agentsDir, result);

  // Check 6: overview.md is not empty / has key sections
  checkOverviewSections(agentsDir, result);

  // Check 7: glossary paths validity
  checkGlossaryPaths(rootDir, agentsDir, result);

  // Check 8: Skill files have valid frontmatter
  await checkSkillFrontmatter(agentsDir, result);

  // Summary
  logger.heading('Results');
  logger.success(`${result.passed} check(s) passed`);
  if (result.warnings > 0) logger.warn(`${result.warnings} warning(s)`);
  if (result.errors > 0) logger.error(`${result.errors} error(s)`);

  if (result.errors > 0) {
    logger.info('');
    logger.info('Run `arules init --merge` to fix missing files.');
    process.exit(1);
  }
}

function checkFileExists(
  baseDir: string,
  relativePath: string,
  label: string,
  result: DiagnosticResult,
  severity: 'error' | 'warning',
): void {
  const fullPath = join(baseDir, relativePath);
  if (existsSync(fullPath)) {
    result.passed++;
  } else {
    if (severity === 'error') {
      logger.error(`Missing: ${relativePath} (${label})`);
      result.errors++;
    } else {
      logger.warn(`Missing: ${relativePath} (${label})`);
      result.warnings++;
    }
  }
}

function checkRuleTrigger(agentsDir: string, result: DiagnosticResult): void {
  const rulePath = join(agentsDir, 'rules', 'rule.md');
  if (!existsSync(rulePath)) return;

  const content = readFileSync(rulePath, 'utf-8');
  if (content.includes('trigger: always_on')) {
    result.passed++;
  } else {
    logger.warn('rule.md is missing `trigger: always_on` frontmatter');
    result.warnings++;
  }
}

function checkAgentsMdReferences(rootDir: string, result: DiagnosticResult): void {
  const agentsMdPath = join(rootDir, 'AGENTS.md');
  if (!existsSync(agentsMdPath)) return;

  const content = readFileSync(agentsMdPath, 'utf-8');
  const expectedRefs = ['.agents/rules/rule.md', '.agents/overviews/overview.md'];

  for (const ref of expectedRefs) {
    if (content.includes(ref)) {
      result.passed++;
    } else {
      logger.warn(`AGENTS.md does not reference "${ref}"`);
      result.warnings++;
    }
  }
}

async function checkRuleIndexReferences(agentsDir: string, result: DiagnosticResult): Promise<void> {
  const rulePath = join(agentsDir, 'rules', 'rule.md');
  if (!existsSync(rulePath)) return;

  const content = readFileSync(rulePath, 'utf-8');
  const pathPattern = /\*\*Path\*\*:\s*(.+)/g;
  let match: RegExpExecArray | null;
  let checkedCount = 0;

  while ((match = pathPattern.exec(content)) !== null) {
    const refPath = match[1].trim();
    const fullPath = join(agentsDir, refPath);
    if (!existsSync(fullPath)) {
      logger.warn(`Broken reference in rule.md: ${refPath}`);
      result.warnings++;
    } else {
      checkedCount++;
    }
  }

  if (checkedCount > 0) {
    result.passed++;
  }
}

function checkOverviewSections(agentsDir: string, result: DiagnosticResult): void {
  const overviewPath = join(agentsDir, 'overviews', 'overview.md');
  if (!existsSync(overviewPath)) return;

  const content = readFileSync(overviewPath, 'utf-8');
  const requiredSections = ['project-intro', 'tech-stack', 'source-structure', 'dev-guide'];

  for (const section of requiredSections) {
    if (content.includes(`## ${section}`)) {
      result.passed++;
    } else {
      logger.warn(`overview.md is missing section: ## ${section}`);
      result.warnings++;
    }
  }
}

function checkGlossaryPaths(rootDir: string, agentsDir: string, result: DiagnosticResult): void {
  const glossaryPath = join(agentsDir, 'overviews', 'glossary.md');
  if (!existsSync(glossaryPath)) return;

  const content = readFileSync(glossaryPath, 'utf-8');
  const pathPattern = /`(src\/[^`]+)`/g;
  let match: RegExpExecArray | null;
  let validCount = 0;
  let staleCount = 0;

  while ((match = pathPattern.exec(content)) !== null) {
    const refPath = match[1].replace(/\/$/, '');
    const fullPath = join(rootDir, refPath);
    if (existsSync(fullPath)) {
      validCount++;
    } else {
      logger.warn(`Stale path in glossary.md: ${match[1]}`);
      staleCount++;
    }
  }

  if (staleCount > 0) {
    result.warnings += staleCount;
  }
  if (validCount > 0) {
    result.passed++;
  }
}

async function checkSkillFrontmatter(agentsDir: string, result: DiagnosticResult): Promise<void> {
  const skillFiles = await fg(['skills/*/SKILL.md'], { cwd: agentsDir });

  for (const skillFile of skillFiles) {
    const fullPath = join(agentsDir, skillFile);
    const content = readFileSync(fullPath, 'utf-8');

    const hasFrontmatter = content.startsWith('---');
    if (!hasFrontmatter) {
      logger.warn(`Skill missing frontmatter: ${skillFile}`);
      result.warnings++;
      continue;
    }

    const frontmatterEnd = content.indexOf('---', 3);
    if (frontmatterEnd === -1) {
      logger.warn(`Skill has malformed frontmatter: ${skillFile}`);
      result.warnings++;
      continue;
    }

    const frontmatter = content.slice(3, frontmatterEnd);
    if (!frontmatter.includes('name:')) {
      logger.warn(`Skill frontmatter missing "name": ${skillFile}`);
      result.warnings++;
    } else if (!frontmatter.includes('description:')) {
      logger.warn(`Skill frontmatter missing "description": ${skillFile}`);
      result.warnings++;
    } else {
      result.passed++;
    }
  }
}
