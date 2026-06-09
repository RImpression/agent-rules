# CLI 工具方案设计

## 一、工具概览

**工具名**：`agent-rules`（bin: `arules`）

**核心理念**：借鉴三层知识架构（规则 → 概览 → 技能），为任意项目生成渐进式加载的 AI 规范文件。采用 **CLI 做骨架 + Skill 做智能填充** 的双层设计。

---

## 二、功能设计

| 命令 | 功能 |
|------|------|
| `arules init` | 扫描项目结构，生成 `.agents/` 目录及基础规范文件 |
| `arules init --template <type>` | 按模板初始化（`react` / `vue` / `node` / `java` / `monorepo`） |
| `arules init --platform <list>` | 初始化时同步生成平台配置文件 |
| `arules add rule <name>` | 新增一条规则文件，自动更新 rule.md 索引 |
| `arules add skill <name>` | 新增一个 Skill 文件，自动更新 rule.md 索引 |
| `arules add module <name>` | 为指定模块生成 module-map |
| `arules refresh` | 重新扫描项目结构，更新 overview |
| `arules refresh --full` | 同时检查所有 module-map，报告新增/移除的模块 |
| `arules doctor` | 校验规范文件的完整性和引用关系 |
| `arules sync` | 生成/更新多平台 AI 工具的配置转发文件 |
| `arules sync --clean` | 删除已生成的平台配置文件 |
| `arules setup-skill` | 安装 AI 增强 Skill 到项目或全局目录 |
| `arules setup-workflow` | 安装内置工作流模板到 `.agents/workflows/` |
| `arules setup-workflow --list` | 查看可用的内置工作流模板 |
| `arules add workflow <name>` | 新增自定义工作流 |

---

## 三、CLI 与 Skill 的分工

### 为什么需要双层设计？

| 维度 | CLI（确定性） | Skill（智能） |
|------|------|------|
| **执行时机** | 用户手动运行 | Agent 在对话中按需触发 |
| **智能程度** | 静态模板 + 配置文件检测 | 理解代码语义、业务逻辑 |
| **迭代方式** | 需用户手动 `refresh` | 对话中自动发现并建议更新 |
| **环境依赖** | 需 Node.js | 零依赖，AI 编辑器内执行 |
| **确定性** | ✅ 相同输入相同输出 | ⚠️ LLM 输出有波动性 |
| **执行速度** | 毫秒级 | 秒级（需推理） |

### 协作流程

```
arules init              → CLI：秒级生成目录骨架和通用模板
arules setup-skill       → CLI：安装 AI 增强 Skill
用户对 AI 说"补充规范"   → Skill：深度分析代码，智能填充内容
  → 读懂实际业务代码 → 生成精准 glossary
  → 识别代码模式 → 生成针对性 rules
  → 理解模块依赖 → 生成 module-map
日常开发对话中            → Skill：持续维护
  → 发现新模块未映射 → 建议更新 overview
  → 发现代码模式变化 → 建议新增规则
arules refresh           → CLI：重新扫描更新 overview
arules doctor            → CLI：检查规范完整性
```

### 各文件的生成者

| 文件 | CLI 生成 | Skill 增强 |
|------|----------|------------|
| `AGENTS.md` | ✅ 完整生成 | — |
| `rules/rule.md` | ✅ 完整生成 | — |
| `overviews/overview.md` | ✅ 基于配置文件扫描 | 🔄 可增强描述 |
| `overviews/glossary.md` | ⚡ 空模板 | ✅ 深度分析代码生成 |
| `rules/project-context/code-standards.md` | ⚡ 通用模板 | ✅ 基于实际代码模式增强 |
| `rules/project-context/agent-capabilities.md` | ⚡ 通用模板 | ✅ 找到实际封装并标注 |
| `skills/project-context/SKILL.md` | ✅ 完整生成 | — |
| `overviews/<module>/module-map.md` | — | ✅ 理解文件职责生成 |

---

## 四、`arules init` 生成的目录结构

```
project-root/
├── AGENTS.md                           ← AI 唯一入口
└── .agents/
    ├── rules/
    │   ├── rule.md                     ← 规则索引（trigger: always_on）
    │   └── project-context/
    │       ├── code-standards.md       ← 代码规范（按项目类型生成）
    │       └── agent-capabilities.md   ← Agent 可用能力约束
    ├── overviews/
    │   ├── overview.md                 ← 项目概览（自动扫描生成）
    │   └── glossary.md                 ← 术语 → 模块路径映射（模板）
    ├── skills/
    │   ├── project-context/
    │   │   └── SKILL.md                ← 项目上下文 Skill（autoActivate）
    │   └── agent-rules-enhance/        ← setup-skill 后安装
    │       └── SKILL.md                ← AI 增强 Skill
    └── workflows/
        └── (空，按需添加)
```

---

## 五、各文件的具体内容模板

### 5.1 `AGENTS.md`（唯一入口）

- 包含 `<INSTRUCTIONS>` 标签，强制 AI 在任务开始前读取 `rule.md` 和 `overview.md`
- 定义通用约束：Execution Root、知识库根目录、入口文件职责、范围控制、隔离原则
- 描述渐进式执行工作流：识别任务范围 → 读取入口知识 → 按需加载 → 正确落盘

### 5.2 `.agents/rules/rule.md`（规则索引）

- 带 `trigger: always_on` frontmatter，确保每次被加载
- 包含规则清单（code-standards、agent-capabilities 等，标注 Path 和 Summary）
- 包含 Skill 清单（project-context 等）
- 底部附场景速查表，让 AI 用"我要做什么"反查需要读的文件

### 5.3 `.agents/overviews/overview.md`（项目概览）

- 自动扫描生成四个核心章节：
  - `project-intro` — 项目名称和描述（从 README 提取）
  - `tech-stack` — 技术栈（从 package.json / pom.xml 等解析）
  - `source-structure` — 源码结构（从目录扫描生成）
  - `dev-guide` — 开发命令（从 scripts / Makefile 提取）

### 5.4 `.agents/overviews/glossary.md`（术语映射）

- CLI 生成空模板，包含使用说明和格式示例
- **由 Skill 智能填充**：分析源码后生成业务词到代码路径的映射

### 5.5 `.agents/skills/project-context/SKILL.md`

- `autoActivate: true`，Session 启动时自动激活
- 引导 Agent 读取 rules、overview、glossary

### 5.6 `.agents/rules/project-context/code-standards.md`

- CLI 按项目类型生成对应模板：
  - **React**: 组件规范、Hooks 规范、状态管理、样式方案
  - **Vue**: Composition API、Pinia、scoped style
  - **Node.js**: 分层架构、错误处理、接口规范
  - **Java**: Controller-Service-Repository、命名、异常处理
- **由 Skill 增强**：基于实际代码模式推断的编码约定

### 5.7 `.agents/rules/project-context/agent-capabilities.md`

- CLI 根据检测到的依赖生成通用能力约束（网络请求、状态管理、UI 组件等）
- **由 Skill 增强**：找到实际的请求封装、store 创建模式等并标注使用方式

---

## 六、AI 增强 Skill 设计

### 6.1 触发条件

| 触发方式 | 示例 |
|----------|------|
| 显式触发 | "初始化规范"、"补充规范"、"增强规范" |
| 功能触发 | "更新 glossary"、"生成 module-map"、"分析项目结构" |
| 隐式发现 | 对话中 Agent 检测到 glossary 内容为模板占位 |
| 被动建议 | 对话中用户提到了 glossary 未收录的业务词 |

### 6.2 两阶段执行

#### 阶段一：深度扫描（init 后首次触发）

```
1. 读取已有骨架
   → overview.md / glossary.md / rule.md

2. 分析源码结构
   → 扫描 src/ 一级二级目录
   → 读取入口文件识别导出
   → 识别目录真实职责

3. 识别代码模式
   → 状态管理方案及使用模式
   → 网络请求封装层
   → 路由方案和页面注册
   → 组件库使用模式
   → 工具函数和 hooks 组织

4. 按优先级生成
   a. glossary.md — 术语映射
   b. code-standards.md — 代码规范增强
   c. agent-capabilities.md — 能力约束增强
   d. module-map — 核心模块详细地图
```

#### 阶段二：持续维护（日常对话中自动触发）

| 场景 | Skill 行为 |
|------|-----------|
| 新模块未映射 | 建议：「发现新模块 `src/xxx/`，是否需要更新 glossary？」 |
| 术语未收录 | 建议：「术语"xxx"在 glossary 中未收录，是否添加？」 |
| 规则可能过期 | 建议：「检测到 xxx 规则可能过期，是否更新？」 |

### 6.3 输出格式规范

#### glossary 条目

```markdown
### 术语名称

- **别名**: 用户可能使用的其他叫法
- **主要目录**: `src/具体路径/`
- **说明**: 一句话描述核心职责
- **依赖**: 依赖的其他模块
- **被依赖**: 被哪些模块使用
```

#### module-map

```markdown
# 模块名 Module Map

## 概述
一段话描述模块的业务定位和技术方案。

## 目录结构
（实际扫描的树形结构）

## 核心文件
| 文件 | 职责 | 复杂度 |
|------|------|--------|

## 公共接口
（该模块向外暴露的 export）

## 数据流
（数据在模块内的流转方式）

## 依赖关系
- 上游：
- 下游：
```

#### 规则增强

```markdown
## 规则名称

### 强制要求（MUST）
- 基于实际代码模式推断的硬性规则

### 推荐实践（SHOULD）
- 从优秀代码片段中提炼的最佳实践

### 禁止事项（MUST NOT）
- 从 linter 配置中提取的禁止项

### 示例
（从项目代码中提取的正反例）
```

### 6.4 Skill 约束

1. **只建议不强写** — 持续维护阶段发现的更新必须征得用户同意
2. **不改业务代码** — 只操作 `.agents/` 目录下的文件
3. **渐进式生成** — 优先 glossary → rules → module-map
4. **可验证性** — 每条规则/映射都能在代码中找到对应证据
5. **保留人工标注** — 合并时保留用户手动编辑的内容

---

## 七、`init` 合并策略

| 场景 | 策略 |
|------|------|
| `.agents/` 不存在 | 全量生成 |
| `.agents/` 已存在，缺少某些文件 | 补齐缺失文件，不动已有文件 |
| `.agents/` 已存在，目标文件也存在 | 交互确认：跳过 / 覆盖 / diff 对比 |
| `--force` | 强制覆盖所有文件 |
| `--merge` | 智能合并（按 markdown heading 级别合并新增章节，保留用户自定义内容） |
| `--dry-run` | 预览变更不写入 |

---

## 八、`refresh` 指令分层

| 指令 | 更新范围 | 自动化程度 |
|------|----------|------------|
| `arules refresh` | overview.md（tech-stack、source-structure、dev-guide） | 全自动 |
| `arules refresh --full` | overview + 检测未映射模块 + 检查 glossary 过期路径 | 全自动 |

> `refresh` 不会修改 `rules/`、`skills/` 中的人工维护文件。这些由 Skill 在对话中智能维护。

---

## 九、`doctor` 检查项

| 检查项 | 严重级别 |
|--------|----------|
| AGENTS.md 是否存在 | Error |
| rule.md 是否存在 | Error |
| overview.md 是否存在 | Error |
| glossary.md 是否存在 | Warning |
| project-context SKILL 是否存在 | Warning |
| code-standards.md 是否存在 | Warning |
| agent-capabilities.md 是否存在 | Warning |
| rule.md 是否包含 `trigger: always_on` | Warning |
| AGENTS.md 是否引用 rule.md 和 overview.md | Warning |
| rule.md 索引中的路径是否实际存在 | Warning |
| overview.md 是否包含四个必要章节 | Warning |
| glossary.md 中引用的路径是否仍有效 | Warning |
| Skill 文件是否有合法 frontmatter | Warning |

---

## 十、`sync` 多平台配置同步

### 设计理念

不同 AI 编码工具有各自的配置文件入口（如 Cursor 读 `.cursorrules`、Claude Code 读 `CLAUDE.md`）。`arules sync` 统一生成这些**转发文件**，所有配置最终指向唯一真相源 `AGENTS.md`，避免多份规范维护不一致的问题。

### 支持的平台

| 平台 | 配置文件路径 | 标识名 |
|------|-------------|--------|
| Cursor | `.cursorrules` | `cursor` |
| Claude Code | `CLAUDE.md` | `claude` |
| GitHub Copilot | `.github/copilot-instructions.md` | `copilot` |
| Windsurf | `.windsurfrules` | `windsurf` |
| OpenAI Codex | `codex.md` | `codex` |
| Gemini | `GEMINI.md` | `gemini` |
| Aone Copilot | `.aone_copilot/rules/agent-rules.md` | `aone-copilot` |

### 命令参数

```bash
arules sync                            # 交互式多选平台
arules sync --platform cursor,claude   # 指定平台（逗号分隔）
arules sync --platform all             # 所有平台
arules sync --force                    # 强制覆盖已有配置
arules sync --dry-run                  # 预览不写入
arules sync --clean                    # 删除所有平台配置
arules sync --clean --platform cursor  # 删除指定平台配置
```

### 与 `init` 的集成

`init` 命令支持 `--platform` 选项，在初始化时一并生成平台配置：

```bash
arules init --platform cursor,claude,copilot
arules init --platform all
```

### 转发文件内容策略

所有平台配置文件的核心内容相同：
1. 标题包含项目名和平台名
2. 指引 AI 读取 `AGENTS.md` 作为唯一入口
3. 说明规则、概览、技能均在 `.agents/` 中定义

Claude Code 的转发文件额外包含 Quick Reference（规则索引、概览、术语表的路径），方便 Claude 快速定位。

---

## 十一、Workflow 工作流设计

### 设计理念

Workflow 是 agent-rules 的"流程层"，解决 AI 执行多步骤任务时缺乏结构化编排的问题。Rules 告诉 AI"什么能做"，Overviews 告诉 AI"项目长什么样"，Skills 告诉 AI"怎么做某件事"，而 Workflow 告诉 AI"**按什么顺序做、每步要达到什么标准**"。

### 核心概念

| 概念 | 说明 |
|------|------|
| **Step** | 工作流中的一个步骤，有明确的目标、动作和完成标准 |
| **Gate（门控）** | 必须通过检查或获得用户确认才能继续的控制点 |
| **循环保护** | 步骤间循环不超过 N 次，超过则暂停求助 |
| **Trigger** | 触发工作流的关键词或条件 |

### 内置工作流模板

| 工作流 | 触发词 | 步骤 | 门控点 |
|--------|--------|------|--------|
| `bug-fix` | 修bug、fix bug、修复问题 | 复现→定位→方案→修复→验证→总结 | 方案（高风险时）、验证 |
| `feature-development` | 开发功能、实现需求 | 分析→设计→实现→验证→收尾 | 设计、验证 |
| `refactoring` | 重构、refactor、优化代码 | 评估→补测试→计划→分步执行→验证→总结 | 计划、验证 |

### 工作流文件格式

```yaml
---
name: workflow-name
description: 工作流描述
trigger:
  keywords: ["触发词1", "触发词2"]
  autoSuggest: true       # 匹配时是否自动建议
  requireConfirm: true    # 是否需要用户确认才启动
---
```

正文使用 Markdown 描述步骤，每步包含：
- **目标** — 此步要达成什么
- **执行动作** — 具体做什么
- **产出** — 此步的输出物
- **完成标准** — 满足什么条件才能进入下一步
- **门控条件**（可选）— 必须通过的检查清单

### 触发策略

| 触发方式 | 说明 |
|----------|------|
| 显式触发 | 用户直接说"按 bug-fix 流程" |
| AI 建议触发 | AI 匹配意图到 trigger.keywords，询问后启动 |

**核心原则**：AI 可以主动提议，但启动权始终在用户手里。

### 命令

```bash
arules setup-workflow --list       # 查看内置模板
arules setup-workflow --all        # 安装所有内置工作流
arules setup-workflow              # 交互式选择
arules setup-workflow --force      # 覆盖已有
arules add workflow <name>         # 创建自定义工作流
```

### 通用约束

所有工作流共享的约束：
1. **循环保护** — 实现↔验证循环不超过 3 次
2. **最小改动** — 不做超出当前步骤范围的改动
3. **门控不跳过** — gate 标记的步骤必须通过
4. **透明汇报** — 每步结论对用户可见
5. **规范联动** — 全程遵循 `code-standards.md`

---

## 十二、技术栈

| 维度 | 选型 | 理由 |
|------|------|------|
| **语言** | TypeScript | 生态成熟，便于解析前端/Node 项目 |
| **CLI 框架** | commander | 轻量、API 简洁 |
| **文件扫描** | fast-glob | 高性能 glob |
| **交互** | prompts | 轻量交互式确认 |
| **样式输出** | chalk | 终端彩色输出 |
| **构建** | tsup | 快速打包 |
| **发布** | npm | `npx agent-rules init` 即可使用 |

---

## 十三、项目自身目录结构

```
agent-rules/
├── src/
│   ├── index.ts                ← CLI 入口
│   ├── commands/
│   │   ├── init.ts             ← init 命令（合并策略 + 交互确认）
│   │   ├── add.ts              ← add rule/skill/module + 自动更新索引
│   │   ├── refresh.ts          ← 重新扫描更新 overview
│   │   ├── doctor.ts           ← 13 项完整性检查
│   │   ├── sync.ts             ← 多平台配置同步（生成/更新/清理转发文件）
│   │   ├── setup-skill.ts      ← 安装 AI 增强 Skill
│   │   └── setup-workflow.ts   ← 安装内置工作流模板
│   ├── platforms/
│   │   └── index.ts            ← 平台定义（7 个平台的配置路径 + 内容生成）
│   ├── scanners/
│   │   ├── index.ts            ← 统一导出
│   │   ├── project-type.ts     ← 项目类型检测（7 种类型）
│   │   ├── tech-stack.ts       ← 技术栈提取（框架/状态管理/CSS/测试/构建/Linter）
│   │   ├── directory.ts        ← 目录结构扫描（树形结构 + 源码目录识别）
│   │   ├── scripts.ts          ← 开发命令提取（package.json / Makefile）
│   │   └── readme.ts           ← README 解析（标题 + 描述提取）
│   ├── templates/
│   │   └── base/
│   │       ├── index.ts            ← 统一导出
│   │       ├── agents-md.ts        ← AGENTS.md 模板
│   │       ├── rule-md.ts          ← rule.md 模板
│   │       ├── overview-md.ts      ← overview.md 模板（接收扫描数据）
│   │       ├── glossary-md.ts      ← glossary.md 模板
│   │       ├── skill-md.ts         ← project-context SKILL 模板
│   │       ├── code-standards-md.ts← 代码规范模板（5 种项目类型）
│   │       └── agent-capabilities-md.ts ← Agent 能力规范模板
│   ├── skill-template/
│   │   └── SKILL.md             ← AI 增强 Skill 源文件
│   ├── workflow-templates/
│   │   ├── bug-fix.md           ← Bug 修复工作流模板
│   │   ├── feature-development.md ← 新功能开发工作流模板
│   │   └── refactoring.md       ← 代码重构工作流模板
│   └── utils/
│       ├── fs.ts               ← 文件操作（合并写入 + heading 级别合并）
│       └── logger.ts           ← 日志输出（彩色 + 文件操作状态）
├── package.json
├── tsconfig.json
├── design.md                   ← 本文档
└── README.md
```

---

## 十四、设计核心原则

| 原则 | 体现 |
|------|------|
| **渐进式加载** | 不一次全量读取，按 索引→概览→详情 逐步深入 |
| **索引与正文分离** | rule.md 只做目录，具体规则在独立文件 |
| **唯一入口** | AGENTS.md 是所有 AI 的统一起点 |
| **场景速查表** | 让 AI 用"我要做什么"反查需要读的文件 |
| **术语桥接** | glossary 解决产品语言→代码路径的鸿沟 |
| **Module Map 分层** | 大模块独立地图，小模块在 overview 内描述 |
| **trigger 机制** | `always_on` 保证核心规则每次必读 |
| **autoActivate** | 关键 Skill 无需手动触发 |
| **CLI 做骨架** | 确定性内容由 CLI 秒级生成 |
| **Skill 做智能** | 需要代码理解的内容由 AI 深度分析 |
| **合并不覆盖** | 保护用户积累的知识资产 |
| **只建议不强写** | Skill 发现更新需求时征求用户同意 |

---

## 十五、支持的项目类型

| 类型 | 检测依据 | 生成的特定规范 |
|------|----------|----------------|
| React | package.json 含 react 依赖 | 组件/Hooks/状态管理规范 |
| Vue | package.json 含 vue 依赖 | Composition API/Pinia 规范 |
| Node.js | package.json 无前端框架 | 分层架构/错误处理/接口规范 |
| Java | pom.xml / build.gradle | Controller-Service-Repository 规范 |
| Python | pyproject.toml / requirements.txt | 通用编码规范 |
| Go | go.mod | 通用编码规范 |
| Monorepo | workspaces / pnpm-workspace.yaml | 框架规范 + 子包结构 |
