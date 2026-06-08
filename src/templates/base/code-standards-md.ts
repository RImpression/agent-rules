import type { ProjectType } from '../../scanners/project-type.js';

export function generateCodeStandardsMd(projectType: ProjectType, framework: string): string {
  const header = `# 代码规范

## 通用原则

- 模块职责单一，避免循环依赖
- 导入语句按分组排列：外部依赖 → 内部模块 → 相对路径
- 优先使用具名导出而非默认导出
- 文件命名使用 kebab-case，组件/类命名使用 PascalCase
`;

  const typeSpecific = getTypeSpecificRules(projectType, framework);

  return header + '\n' + typeSpecific;
}

function getTypeSpecificRules(projectType: ProjectType, framework: string): string {
  switch (projectType) {
    case 'react':
      return getReactRules(framework);
    case 'vue':
      return getVueRules();
    case 'node':
      return getNodeRules(framework);
    case 'java':
      return getJavaRules();
    default:
      return getGenericRules();
  }
}

function getReactRules(framework: string): string {
  return `## React 规范

### 组件

- 函数组件优先，避免 class 组件
- Props 使用 interface 定义并显式标注
- 组件文件与组件同名（PascalCase）

### Hooks

- 自定义 Hook 以 \`use\` 前缀命名
- Hook 内部不要直接调用 API，使用 services 层封装
- 依赖数组必须完整且准确

### 状态管理

- 局部状态用 \`useState\` / \`useReducer\`
- 跨组件共享状态使用项目选定的状态管理库
- 避免 prop drilling 超过 2 层

### 样式

- 优先使用 CSS Modules 或项目指定的样式方案
- 类名使用 camelCase（CSS Modules）
- 响应式设计使用项目统一的断点变量
${framework.includes('Next') ? `
### Next.js 特定

- 页面组件放在 \`app/\` 或 \`pages/\` 目录
- 数据获取使用 Server Components 或 \`getServerSideProps\`
- 客户端交互组件标记 \`'use client'\`
` : ''}`;
}

function getVueRules(): string {
  return `## Vue 规范

### 组件

- 使用 \`<script setup>\` + Composition API
- Props 使用 \`defineProps\` 并提供类型标注
- Emits 使用 \`defineEmits\` 显式声明

### 组合式函数（Composables）

- 以 \`use\` 前缀命名
- 返回值使用解构友好的对象格式
- 避免在 composable 中直接操作 DOM

### 状态管理

- 使用 Pinia 进行全局状态管理
- Store 按功能域拆分
- 避免直接修改 state，使用 actions

### 样式

- 使用 \`<style scoped>\` 隔离样式
- 深度选择器使用 \`:deep()\`
`;
}

function getNodeRules(framework: string): string {
  return `## Node.js 规范

### 模块

- 使用 ESM（\`import/export\`）而非 CommonJS
- 按层分离：routes → controllers → services → repositories
- 每层只允许调用下一层，禁止跨层调用

### 错误处理

- 使用统一的错误处理中间件
- 自定义业务错误继承 \`Error\` 并包含错误码
- 异步操作必须有 try/catch 或错误传播

### 接口

- RESTful 命名：资源名词复数
- 响应格式统一：\`{ code, data, message }\`
- 输入验证使用 schema 库（如 zod / joi）
${framework.includes('NestJS') ? `
### NestJS 特定

- Controller 只做参数接收和响应包装
- 业务逻辑放在 Service 层
- 使用 DTO 做请求/响应类型约束
- 依赖注入优先，避免直接 new 实例
` : ''}`;
}

function getJavaRules(): string {
  return `## Java 规范

### 分层

- Controller → Service → Repository 三层架构
- DTO 用于接口传输，Entity 用于持久化
- 禁止 Controller 直接操作 Repository

### 命名

- 包名全小写
- 类名 PascalCase，方法名 camelCase
- 常量 UPPER_SNAKE_CASE

### 异常

- 自定义业务异常继承 \`RuntimeException\`
- 使用全局异常处理器统一包装响应
- 区分业务异常（可预期）和系统异常（不可预期）

### 其他

- 使用 Lombok 简化 POJO 但禁止 \`@Data\`（用 \`@Getter\` + \`@Setter\`）
- 集合操作优先使用 Stream API
- 日志使用 SLF4J + Logback
`;
}

function getGenericRules(): string {
  return `## 编码规范

### 文件组织

- 按功能/模块组织目录，而非按类型
- 相关文件放在同一目录下
- 公共工具放在 \`utils/\` 或 \`lib/\`

### 命名

- 变量/函数使用描述性名称，避免缩写
- 布尔变量以 \`is\` / \`has\` / \`should\` 开头
- 常量使用 UPPER_SNAKE_CASE

### 注释

- 代码应自解释，减少冗余注释
- 复杂业务逻辑添加"为什么"而非"做什么"的注释
- 公共 API 必须有文档注释
`;
}
