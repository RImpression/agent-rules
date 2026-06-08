export function generateRuleMd(projectType: string): string {
  return `---
trigger: always_on
---

# 规则索引

## 使用方式

1. 先阅读本文件，确认当前仓库有哪些规则和 Skill。
2. 根据任务类型进入对应的规则文档或 Skill 文档。
3. 如需理解项目背景，读取 \`.agents/overviews/overview.md\`。
4. 如需术语映射，读取 \`.agents/overviews/glossary.md\`。

## 规则清单

### code-standards

- **Path**: rules/project-context/code-standards.md
- **Category**: project-context
- **Summary**: ${projectType} 项目代码规范。模块依赖规则、Import 规范、编码模式约束。

### agent-capabilities

- **Path**: rules/project-context/agent-capabilities.md
- **Category**: project-context
- **Summary**: Agent 底层能力要求。网络请求、状态管理、UI 组件、工具函数等封装规范。

## Skill 清单

### skill-project-context

- **Path**: skills/project-context/SKILL.md
- **Category**: skill
- **Summary**: 项目背景提供者 Skill。会话自动激活，为 Agent 提供项目基础上下文信息。

## 场景速查

| 我要做的事 | 必读规则 | 推荐 Skill |
|------|------|------|
| 新增/修改业务代码 | code-standards.md | project-context |
| 理解项目结构 | — | project-context |
| 使用底层能力（请求/状态/路由等） | agent-capabilities.md | — |
`;
}
