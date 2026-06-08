export function generateAgentsMd(projectName: string): string {
  return `<INSTRUCTIONS>
强制要求：在开始任何任务分析或执行前，必须先读取：
- \`.agents/rules/rule.md\` —— 规则索引
- \`.agents/overviews/overview.md\` —— 项目概览

当任务范围不明确时，再读取：
- \`.agents/overviews/glossary.md\` —— 术语与模块映射

# ${projectName}

通用约束：
1. **Execution Root**
   - 当前仓库根目录 \`./\` 是唯一的执行根。
   - 所有默认读写都必须限制在当前仓库内。
2. **知识库根目录**
   - \`.agents/\` 是本仓库唯一的知识库根目录。
   - 规则、概览、术语、Skill、Workflow 都应以 \`.agents/\` 为准。
3. **入口文件职责**
   - \`AGENTS.md\` 是唯一权威入口。
   - 其他 Agent 入口文件（如 \`CLAUDE.md\`、\`GEMINI.md\`）只能作为转发入口。
4. **范围控制**
   - 大范围搜索代码前，先结合 \`overview.md\` 与 \`glossary.md\` 做模块范围映射。
   - 代码修改必须落在真实业务目录，不应把业务改动写进 \`.agents/\`。
5. **隔离原则**
   - 不要主动读取仓库子目录中的其他 Agent 入口文件来决定行为。
   - 根目录 \`AGENTS.md\` 与 \`.agents/\` 才是当前仓库的唯一规则面。
</INSTRUCTIONS>

## 基于提示词的上下文加载

当用户提供需求时：

1. 先提取业务词、模块名、页面名、技术栈关键词。
2. 先参考 \`.agents/overviews/overview.md\` 判断大致范围。
3. 若范围仍不清晰，再读取 \`.agents/overviews/glossary.md\` 做术语到模块路径的映射。
4. 确认真实实现目录后，再开始读写业务代码。

## 渐进式执行工作流

1. **识别任务范围**
   - 判断当前任务属于业务代码、知识库内容、流程规范还是项目背景问题。
2. **读取入口知识**
   - 读取 \`.agents/rules/rule.md\`
   - 读取 \`.agents/overviews/overview.md\`
   - 视需要读取 \`.agents/overviews/glossary.md\`
3. **加载对应层级**
   - \`rules\` 负责约束与规范
   - \`overviews\` 负责背景与边界
   - \`skills\` 负责可复用执行能力
   - \`workflows\` 负责多步骤流程
4. **只在正确位置落盘**
   - 代码改动写入真实源码目录
   - 知识库改动写入 \`.agents/\`
`;
}
