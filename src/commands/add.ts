import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeFileWithCheck } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

interface AddOptions {
  description?: string;
}

export async function addCommand(type: string, name: string, options: AddOptions): Promise<void> {
  const rootDir = process.cwd();
  const agentsDir = join(rootDir, '.agents');

  switch (type) {
    case 'rule':
      await addRule(agentsDir, name, options);
      break;
    case 'skill':
      await addSkill(agentsDir, name, options);
      break;
    case 'module':
      await addModule(agentsDir, name, options);
      break;
    case 'workflow':
      await addWorkflow(agentsDir, name, options);
      break;
    default:
      logger.error(`Unknown type: "${type}". Must be one of: rule, skill, module, workflow`);
      process.exit(1);
  }
}

async function addRule(agentsDir: string, name: string, options: AddOptions): Promise<void> {
  const kebabName = toKebabCase(name);
  const filePath = join(agentsDir, 'rules', 'project-context', `${kebabName}.md`);
  const description = options.description || `${name} 规范`;

  const content = `# ${name}

## 概述

${description}

## 规则

<!-- 在此编写具体规则 -->

### 强制要求

- 

### 推荐实践

- 

### 禁止事项

- 
`;

  const result = writeFileWithCheck(filePath, content, {});
  logger.file(result.action, result.path.replace(process.cwd() + '/', ''));

  if (result.action === 'created') {
    logger.info(`Rule created. Remember to update .agents/rules/rule.md index.`);
    appendToRuleIndex(agentsDir, kebabName, description);
  }
}

async function addSkill(agentsDir: string, name: string, options: AddOptions): Promise<void> {
  const kebabName = toKebabCase(name);
  const filePath = join(agentsDir, 'skills', kebabName, 'SKILL.md');
  const description = options.description || `${name} Skill`;

  const content = `---
name: ${kebabName}
description: ${description}
autoActivate: false
---

# ${name}

## 目标

${description}

## 触发条件

<!-- 描述何时应激活此 Skill -->

## 执行步骤

1. 
2. 
3. 

## 输入

<!-- 此 Skill 需要的输入信息 -->

## 输出

<!-- 此 Skill 产出的结果 -->
`;

  const result = writeFileWithCheck(filePath, content, {});
  logger.file(result.action, result.path.replace(process.cwd() + '/', ''));

  if (result.action === 'created') {
    logger.success(`Skill "${name}" created at: .agents/skills/${kebabName}/SKILL.md`);
    appendSkillToRuleIndex(agentsDir, kebabName, description);
  }
}

async function addModule(agentsDir: string, name: string, options: AddOptions): Promise<void> {
  const kebabName = toKebabCase(name);
  const filePath = join(agentsDir, 'overviews', kebabName, 'module-map.md');
  const description = options.description || `${name} 模块`;

  const content = `# ${name} Module Map

## 概述

${description}

## 目录结构

\`\`\`
src/${kebabName}/
├── 
└── 
\`\`\`

## 核心文件

| 文件 | 职责 |
|------|------|
| | |

## 模块依赖

- 依赖: 
- 被依赖: 

## 关键接口

<!-- 列出此模块暴露的关键接口/类型 -->
`;

  const result = writeFileWithCheck(filePath, content, {});
  logger.file(result.action, result.path.replace(process.cwd() + '/', ''));

  if (result.action === 'created') {
    logger.success(`Module map created at: .agents/overviews/${kebabName}/module-map.md`);
    logger.info(`Remember to add a reference in .agents/overviews/overview.md`);
  }
}

function appendToRuleIndex(agentsDir: string, name: string, description: string): void {
  const ruleIndexPath = join(agentsDir, 'rules', 'rule.md');
  if (!existsSync(ruleIndexPath)) return;

  const content = readFileSync(ruleIndexPath, 'utf-8');
  const entry = `
### ${name}

- **Path**: rules/project-context/${name}.md
- **Category**: project-context
- **Summary**: ${description}
`;

  const insertionPoint = content.indexOf('## 场景速查');
  if (insertionPoint !== -1) {
    const updated = content.slice(0, insertionPoint) + entry + '\n' + content.slice(insertionPoint);
    writeFileSync(ruleIndexPath, updated, 'utf-8');
  } else {
    writeFileSync(ruleIndexPath, content + entry, 'utf-8');
  }

  logger.success(`Updated rule.md index with "${name}"`);
}

function appendSkillToRuleIndex(agentsDir: string, name: string, description: string): void {
  const ruleIndexPath = join(agentsDir, 'rules', 'rule.md');
  if (!existsSync(ruleIndexPath)) return;

  const content = readFileSync(ruleIndexPath, 'utf-8');
  const entry = `
### skill-${name}

- **Path**: skills/${name}/SKILL.md
- **Category**: skill
- **Summary**: ${description}
`;

  const insertionPoint = content.indexOf('## 场景速查');
  if (insertionPoint !== -1) {
    const updated = content.slice(0, insertionPoint) + entry + '\n' + content.slice(insertionPoint);
    writeFileSync(ruleIndexPath, updated, 'utf-8');
  } else {
    writeFileSync(ruleIndexPath, content + entry, 'utf-8');
  }

  logger.success(`Updated rule.md index with skill "${name}"`);
}

async function addWorkflow(agentsDir: string, name: string, options: AddOptions): Promise<void> {
  const kebabName = toKebabCase(name);
  const filePath = join(agentsDir, 'workflows', `${kebabName}.md`);
  const description = options.description || `${name} 工作流`;

  const content = `---
name: ${kebabName}
description: ${description}
trigger:
  keywords: ["${name}"]
  autoSuggest: true
  requireConfirm: true
---

# ${name} Workflow

## 目标

${description}

## 适用场景

<!-- 描述何时应使用此工作流 -->

## 工作流步骤

### Step 1: 分析

**目标**：理解任务上下文

**执行动作**：
1. 

**完成标准**：

---

### Step 2: 执行

**目标**：实施具体操作

**执行动作**：
1. 

**完成标准**：

---

### Step 3: 验证

**目标**：确认结果正确

**门控条件（必须全部通过）**：
- [ ] 

---

### Step 4: 总结

**目标**：汇报结果

**产出**：
\`\`\`markdown
## 执行摘要

**任务**：<描述>
**结果**：<结果>
**变更**：<变更说明>
\`\`\`

## 约束

1. 
`;

  const result = writeFileWithCheck(filePath, content, {});
  logger.file(result.action, result.path.replace(process.cwd() + '/', ''));

  if (result.action === 'created') {
    logger.success(`Workflow "${name}" created at: .agents/workflows/${kebabName}.md`);
    appendWorkflowToRuleIndex(agentsDir, kebabName, description);
  }
}

function appendWorkflowToRuleIndex(agentsDir: string, name: string, description: string): void {
  const ruleIndexPath = join(agentsDir, 'rules', 'rule.md');
  if (!existsSync(ruleIndexPath)) return;

  const content = readFileSync(ruleIndexPath, 'utf-8');
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

  logger.success(`Updated rule.md index with workflow "${name}"`);
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}
