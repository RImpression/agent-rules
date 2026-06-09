import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import prompts from 'prompts';
import { writeFileWithCheck } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

interface SetupWorkflowOptions {
  list?: boolean;
  all?: boolean;
  force?: boolean;
}

function getTemplatesDir(): string {
  const currentFileUrl = import.meta.url;
  const currentFilePath = new URL(currentFileUrl).pathname;
  const distDir = dirname(currentFilePath);

  // Try relative to project src (during development or from dist)
  const candidates = [
    join(distDir, '..', 'src', 'workflow-templates'),
    join(distDir, '..', 'workflow-templates'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  // Fallback: look from package root
  let dir = distDir;
  while (dir !== '/') {
    if (existsSync(join(dir, 'package.json'))) {
      const fromRoot = join(dir, 'src', 'workflow-templates');
      if (existsSync(fromRoot)) return fromRoot;
      break;
    }
    dir = dirname(dir);
  }

  return candidates[0];
}

interface WorkflowTemplate {
  name: string;
  description: string;
  fileName: string;
}

function getAvailableTemplates(): WorkflowTemplate[] {
  const templatesDir = getTemplatesDir();
  if (!existsSync(templatesDir)) return [];

  const files = readdirSync(templatesDir).filter((f) => f.endsWith('.md'));
  return files.map((fileName) => {
    const content = readFileSync(join(templatesDir, fileName), 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let name = basename(fileName, '.md');
    let description = '';

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
      const descMatch = frontmatter.match(/^description:\s*(.+)$/m);
      if (nameMatch) name = nameMatch[1].trim();
      if (descMatch) description = descMatch[1].trim();
    }

    return { name, description, fileName };
  });
}

export async function setupWorkflowCommand(options: SetupWorkflowOptions): Promise<void> {
  const rootDir = process.cwd();

  logger.heading('arules setup-workflow — Install workflow templates');

  const templates = getAvailableTemplates();

  if (templates.length === 0) {
    logger.error('No workflow templates found.');
    process.exit(1);
  }

  // --list: just show available workflows
  if (options.list) {
    logger.info('Available workflow templates:');
    for (const template of templates) {
      console.log(`  ${template.name.padEnd(24)} ${template.description}`);
    }
    return;
  }

  // Determine which workflows to install
  let selectedTemplates: WorkflowTemplate[];

  if (options.all) {
    selectedTemplates = templates;
  } else {
    const response = await prompts({
      type: 'multiselect',
      name: 'workflows',
      message: 'Select workflows to install:',
      choices: templates.map((t) => ({
        title: `${t.name} — ${t.description}`,
        value: t.name,
        selected: false,
      })),
      min: 1,
      hint: 'Space to select, Enter to confirm',
    });

    if (!response.workflows || response.workflows.length === 0) {
      logger.warn('No workflows selected. Cancelled.');
      return;
    }

    selectedTemplates = response.workflows.map(
      (name: string) => templates.find((t) => t.name === name)!,
    );
  }

  // Install selected workflows
  const templatesDir = getTemplatesDir();
  const workflowsDir = join(rootDir, '.agents', 'workflows');
  const writeOptions = { force: options.force };
  let installed = 0;
  let skipped = 0;

  for (const template of selectedTemplates) {
    const sourcePath = join(templatesDir, template.fileName);
    const targetPath = join(workflowsDir, template.fileName);
    const content = readFileSync(sourcePath, 'utf-8');

    const result = writeFileWithCheck(targetPath, content, writeOptions);
    logger.file(result.action, `.agents/workflows/${template.fileName}`);

    if (result.action === 'created' || result.action === 'overwritten') {
      installed++;
      appendWorkflowToRuleIndex(rootDir, template.name, template.description);
    } else {
      skipped++;
    }
  }

  logger.heading('Summary');
  if (installed > 0) logger.success(`${installed} workflow(s) installed`);
  if (skipped > 0) logger.warn(`${skipped} workflow(s) skipped (already exist, use --force to overwrite)`);

  // Update rule.md index
  if (installed > 0) {
    logger.info('Updated rule.md index with workflow entries.');
  }

  logger.info('');
  logger.info('Usage: Tell your AI a trigger keyword (e.g., "按 bug-fix 流程处理") to activate a workflow.');
}

function appendWorkflowToRuleIndex(rootDir: string, name: string, description: string): void {
  const ruleIndexPath = join(rootDir, '.agents', 'rules', 'rule.md');
  if (!existsSync(ruleIndexPath)) return;

  const content = readFileSync(ruleIndexPath, 'utf-8');

  // Check if this workflow is already indexed
  if (content.includes(`workflows/${name}.md`)) return;

  const entry = `
### workflow-${name}

- **Path**: workflows/${name}.md
- **Category**: workflow
- **Summary**: ${description}
`;

  const insertionPoint = content.indexOf('## 场景速查');
  if (insertionPoint !== -1) {
    const updated = content.slice(0, insertionPoint) + entry + '\n' + content.slice(insertionPoint);
    writeFileSync(ruleIndexPath, updated, 'utf-8');
  } else {
    writeFileSync(ruleIndexPath, content + entry, 'utf-8');
  }
}
