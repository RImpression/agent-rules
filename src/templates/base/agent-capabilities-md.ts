import type { ProjectType } from '../../scanners/project-type.js';
import type { TechStackInfo } from '../../scanners/tech-stack.js';

export function generateAgentCapabilitiesMd(projectType: ProjectType, techStack: TechStackInfo): string {
  const header = `# Agent 能力规范

本文件定义 Agent 在当前项目中可使用的底层能力及其约束。
Agent 在编写代码时必须遵循这些封装规范，不得绕过已有封装直接使用底层库。

`;

  const capabilities = buildCapabilities(projectType, techStack);
  return header + capabilities;
}

function buildCapabilities(projectType: ProjectType, techStack: TechStackInfo): string {
  const sections: string[] = [];

  // Network requests
  sections.push(`## 网络请求

- 所有 HTTP 请求必须通过项目统一的请求封装层发起
- 禁止直接使用原生 \`fetch\` 或 \`axios\` 实例
- 请求层应统一处理鉴权 Token、错误码转换、超时重试
- 文件上传使用封装好的 upload 方法
`);

  // State management
  if (techStack.stateManagement) {
    sections.push(`## 状态管理

- 使用 ${techStack.stateManagement.split(' ')[0]} 作为状态管理方案
- 全局状态按业务域拆分为独立 store 文件
- 组件内局部状态无需放入全局 store
- 异步操作的状态（loading/error/data）使用统一模式
`);
  }

  // UI components
  if (projectType === 'react' || projectType === 'vue') {
    sections.push(`## UI 组件

- 优先使用项目已引入的组件库
- 自定义组件放在 \`components/\` 目录
- 业务容器组件放在 \`containers/\` 或页面目录内
- 组件 Props 必须定义 TypeScript 类型
`);
  }

  // Routing
  if (projectType === 'react' || projectType === 'vue') {
    sections.push(`## 路由

- 使用项目已配置的路由方案
- 新增页面需在路由配置中注册
- 路由参数使用类型安全的方式获取
- 页面级组件支持按需加载（lazy）
`);
  }

  // Styling
  if (techStack.cssFramework) {
    sections.push(`## 样式

- 样式方案：${techStack.cssFramework.split(' ')[0]}
- 颜色值优先使用项目定义的 CSS 变量或 token
- 禁止硬编码魔法数值，使用设计系统提供的间距/尺寸变量
- 日夜间/主题切换通过 CSS 变量实现
`);
  }

  // Testing
  if (techStack.testFramework) {
    sections.push(`## 测试

- 测试框架：${techStack.testFramework.split(' ')[0]}
- 单元测试文件与源文件同目录或放在 \`__tests__/\` 下
- 测试文件命名：\`*.test.ts\` 或 \`*.spec.ts\`
- Mock 外部依赖，不在单元测试中发起真实网络请求
`);
  }

  // Build tools
  if (techStack.bundler) {
    sections.push(`## 构建工具

- 构建工具：${techStack.bundler.split(' ')[0]}
- 自定义构建配置放在项目根目录的配置文件中
- 环境变量通过 \`.env\` 文件或构建插件注入
- 路径别名在构建配置和 tsconfig 中同步维护
`);
  }

  // Utilities
  sections.push(`## 工具函数

- 通用工具函数放在 \`utils/\` 或 \`lib/\` 目录
- 优先使用项目已引入的工具库（如 lodash-es、dayjs 等）
- 禁止重复造轮子：新增工具前先检查是否已有类似实现
- 工具函数必须是纯函数，无副作用
`);

  return sections.join('\n');
}
