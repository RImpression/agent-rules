export function generateProjectContextSkillMd(): string {
  return `---
name: project-context
description: 项目背景提供者。在 Session 启动时自动激活，为 Agent 提供项目基础上下文。
autoActivate: true
---

# Project Context

## 目标

为 AI Agent 提供项目的核心背景信息，确保每次交互都基于正确的项目理解。

## 自动激活

此 Skill 在 Session 启动时自动激活，无需手动触发。

## 提供的上下文

1. **项目规范** — 参见 \`../../rules/project-context/\`
2. **项目概览** — 参见 \`../../overviews/overview.md\`
3. **术语映射** — 参见 \`../../overviews/glossary.md\`

## 使用方式

Agent 在执行任务前应：
1. 遵循 rules 中定义的规范
2. 先读取 overview.md 理解项目结构和业务背景
3. 当业务词无法直接映射到代码目录时，再读取 glossary.md
`;
}
