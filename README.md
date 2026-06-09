# agent-rules (arules)

CLI 工具，为现有项目自动生成 AI 可读的项目规范（`.agents/` 目录），让 AI Agent 能够渐进式地理解项目结构、遵循代码规范、精准定位模块。

## 安装

```bash
# 全局安装
npm install -g agent-rules

# 或使用 npx 直接运行
npx agent-rules init
```

## 快速开始

```bash
# 进入你的项目目录
cd your-project

# 初始化 AI 规范
arules init

# 查看规范完整性
arules doctor
```

## 命令

### `arules init`

扫描项目结构，生成 `.agents/` 目录及 `AGENTS.md` 入口文件。

```bash
arules init                    # 自动检测项目类型并生成
arules init --platform cursor,claude,copilot # 指定平台
arules init --platform all     # 生成所有平台配置
arules init -t react           # 指定模板类型
arules init --force            # 强制覆盖已有文件
arules init --merge            # 合并模式（保留用户自定义，补齐缺失）
arules init --dry-run          # 预览将生成的文件（不实际写入）
```

**合并策略**（当 `.agents/` 已存在时）：

| 场景 | 行为 |
|------|------|
| 文件不存在 | 直接创建 |
| 文件已存在且未修改 | 跳过 |
| 文件已存在（无 --force/--merge） | 交互询问 |
| `--force` | 覆盖所有 |
| `--merge` | 保留已有内容，追加新增章节 |

### `arules add <type> <name>`

新增规则、Skill 或模块地图。

```bash
arules add rule api-standards -d "API 接口规范"
arules add skill code-review -d "代码审查 Skill"
arules add module user-center -d "用户中心模块"
```

**type 可选值**：
- `rule` — 在 `.agents/rules/project-context/` 下创建规则文件，并更新 `rule.md` 索引
- `skill` — 在 `.agents/skills/<name>/` 下创建 SKILL.md
- `module` — 在 `.agents/overviews/<name>/` 下创建 module-map.md

### `arules refresh`

重新扫描项目结构，更新 overview 文件。

```bash
arules refresh              # 更新 overview.md（技术栈、目录结构、开发命令）
arules refresh --full       # 同时检查所有 module-map，报告新增/移除的模块
```

**refresh 更新范围**：

| 模式 | 更新内容 |
|------|----------|
| 默认 | `overview.md`（tech-stack、source-structure、dev-guide） |
| `--full` | overview + 检测未映射模块 + 检查 glossary 过期路径 |

> `refresh` 不会修改 `rules/`、`skills/` 中的人工维护文件。

### `arules sync`

生成或更新多平台 AI 工具的配置文件（转发到 AGENTS.md）。

```bash
arules sync                            # 交互式选择要生成的平台
arules sync --platform cursor,claude   # 指定平台
arules sync --platform all             # 生成所有平台配置
arules sync --platform all --force     # 强制覆盖已有配置
arules sync --clean                    # 删除所有平台配置文件
arules sync --clean --platform cursor  # 删除指定平台配置
arules sync --dry-run                  # 预览不写入
```

**支持的平台**：

| 平台 | 配置文件路径 | 标识名 |
|------|-------------|--------|
| Cursor | `.cursorrules` | `cursor` |
| Claude Code | `CLAUDE.md` | `claude` |
| GitHub Copilot | `.github/copilot-instructions.md` | `copilot` |
| Windsurf | `.windsurfrules` | `windsurf` |
| OpenAI Codex | `codex.md` | `codex` |
| Gemini | `GEMINI.md` | `gemini` |
| Aone Copilot | `.aone_copilot/rules/agent-rules.md` | `aone-copilot` |


### `arules doctor`

检查规范文件的完整性和引用关系。

```bash
arules doctor
```

**检查项**：
- 核心文件是否存在（AGENTS.md、rule.md、overview.md）
- `rule.md` 是否包含 `trigger: always_on`
- `AGENTS.md` 是否正确引用规则索引和概览
- `rule.md` 索引中的路径是否实际存在
- `overview.md` 是否包含必要章节
- `glossary.md` 中引用的路径是否仍然有效
- Skill 文件是否有合法的 frontmatter

## 生成的目录结构

```
your-project/
├── AGENTS.md                           ← AI 唯一入口
└── .agents/
    ├── rules/
    │   ├── rule.md                     ← 规则索引（always_on）
    │   └── project-context/
    │       ├── code-standards.md       ← 代码规范（按项目类型生成）
    │       └── agent-capabilities.md   ← Agent 可用能力约束
    ├── overviews/
    │   ├── overview.md                 ← 项目概览（自动扫描生成）
    │   └── glossary.md                 ← 术语 → 模块路径映射
    ├── skills/
    │   └── project-context/
    │       └── SKILL.md                ← 项目上下文 Skill（autoActivate）
    └── workflows/
        └── (空，按需添加)
```

## 设计哲学

### 渐进式加载

AI 不需要一次读取所有规范文件，而是按需逐步深入：

```
AGENTS.md (入口)
  → rule.md (规则索引) + overview.md (项目概览)
    → 具体规则文件 / glossary.md / module-map.md
```

### 索引与正文分离

- `rule.md` 只做目录索引，具体规则在独立文件中
- `overview.md` 提供全局视图，细节在各 module-map 中

### 合并不覆盖

- `init` 默认不覆盖已有文件
- `refresh` 只更新可自动生成的内容（overview），不动人工维护的规则
- 所有写入操作支持 `--dry-run` 预览

### 术语桥接

`glossary.md` 解决产品语言（如"用户中心"）到代码路径（如 `src/modules/user/`）的映射鸿沟。

## 支持的项目类型

| 类型 | 检测依据 | 生成的特定规范 |
|------|----------|----------------|
| React | package.json 含 react 依赖 | React 组件/Hooks/状态管理规范 |
| Vue | package.json 含 vue 依赖 | Composition API/Pinia 规范 |
| Node.js | package.json 无前端框架 | 分层架构/错误处理/接口规范 |
| Java | pom.xml / build.gradle | Controller-Service-Repository 规范 |
| Python | pyproject.toml / requirements.txt | 通用编码规范 |
| Go | go.mod | 通用编码规范 |
| Monorepo | workspaces / pnpm-workspace.yaml | 框架规范 + 子包结构 |

## AI 智能增强（Skill）

CLI 只负责生成**目录骨架和通用模板**。要让规范内容精准匹配你的实际项目，需要安装 AI 增强 Skill：

```bash
# 在 init 之后运行
arules setup-skill            # 安装到当前项目 .agents/skills/
arules setup-skill --global   # 安装到全局 ~/.agents/skills/
```

安装后，在 AI 对话中说**"补充规范"**或**"分析项目结构"**，Skill 会自动：

1. **深度分析源码** — 读取入口文件、识别模块职责，而非仅看目录名
2. **生成精准 glossary** — 从代码和注释中提取业务术语，建立到代码路径的映射
3. **增强 code-standards** — 基于实际代码模式（而非通用模板）生成编码规范
4. **创建 module-map** — 为核心模块生成详细的文件职责、接口、依赖关系描述

### CLI 与 Skill 的分工

| 维度 | CLI（确定性） | Skill（智能） |
|------|------|------|
| **目录骨架** | ✅ 秒级生成 | — |
| **overview.md** | ✅ 基于配置文件扫描 | 🔄 可增强描述 |
| **glossary.md** | ⚡ 空模板 | ✅ 深度分析代码生成 |
| **code-standards** | ⚡ 通用模板 | ✅ 基于实际代码模式 |
| **module-map** | — | ✅ 理解文件职责 |
| **持续维护** | `refresh` 更新结构 | ✅ 对话中实时建议 |

### Skill 触发词

- "初始化规范" / "补充规范" / "增强规范"
- "更新 glossary" / "生成 module-map"
- "分析项目结构" / "规范维护"

## 配合 AI 使用

生成规范后，使用 `arules sync` 一键生成各平台的配置转发文件：

```bash
# 生成所有平台配置
arules sync --platform all

# 或只生成你使用的平台
arules sync --platform cursor,claude
```

各平台配置文件遵循"**转发入口**"原则 — 指向 `AGENTS.md` 作为唯一真相源，确保所有 AI 工具行为一致。

- **Cursor** — `.cursorrules` 转发到 AGENTS.md
- **Claude Code** — `CLAUDE.md` 转发到 AGENTS.md
- **GitHub Copilot** — `.github/copilot-instructions.md` 转发到 AGENTS.md
- **Windsurf** — `.windsurfrules` 转发到 AGENTS.md
- **OpenAI Codex** — `codex.md` 转发到 AGENTS.md
- **Gemini** — `GEMINI.md` 转发到 AGENTS.md
- **Aone Copilot** — `.aone_copilot/rules/agent-rules.md` 转发到 AGENTS.md

## 开发

```bash
# 克隆仓库
git clone <repo-url>
cd cli

# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 构建
npm run build

# 本地测试
node dist/index.js init --dry-run
```

## License

MIT
