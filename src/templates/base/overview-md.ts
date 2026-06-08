import type { TechStackInfo } from '../../scanners/tech-stack.js';
import type { SourceStructure } from '../../scanners/directory.js';
import type { DevScripts } from '../../scanners/scripts.js';
import { formatTechStackSummary } from '../../scanners/tech-stack.js';
import { formatDevGuideSummary } from '../../scanners/scripts.js';
import { formatSourceStructureSummary } from '../../scanners/directory.js';

export interface OverviewData {
  projectName: string;
  projectDescription: string;
  techStack: TechStackInfo;
  sourceStructure: SourceStructure;
  devScripts: DevScripts;
}

export function generateOverviewMd(data: OverviewData): string {
  return `## 如何使用本索引

1. 通过本文件理解项目背景、技术栈和模块边界。
2. 若已经能判断任务影响范围，可直接进入对应源码目录。
3. 若模块映射不明确，再读取 \`.agents/overviews/glossary.md\`。
4. 本文件负责"背景与边界"，不承载硬性规则正文。

## project-intro

- **Summary**: ${data.projectName}${data.projectDescription ? ` — ${data.projectDescription}` : ''}

## tech-stack

- **Summary**: ${formatTechStackSummary(data.techStack)}

## source-structure

- **Summary**: ${formatSourceStructureSummary(data.sourceStructure)}

## dev-guide

- **Summary**: ${formatDevGuideSummary(data.devScripts)}
`;
}
