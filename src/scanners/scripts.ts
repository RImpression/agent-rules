import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface DevScripts {
  install: string;
  dev: string;
  build: string;
  test: string;
  lint: string;
  allScripts: Record<string, string>;
}

export function extractScripts(rootDir: string): DevScripts {
  const result: DevScripts = {
    install: '',
    dev: '',
    build: '',
    test: '',
    lint: '',
    allScripts: {},
  };

  const packageJsonPath = join(rootDir, 'package.json');
  if (existsSync(packageJsonPath)) {
    return extractNodeScripts(rootDir, packageJsonPath, result);
  }

  // Makefile
  const makefilePath = join(rootDir, 'Makefile');
  if (existsSync(makefilePath)) {
    return extractMakefileTargets(makefilePath, result);
  }

  return result;
}

function extractNodeScripts(rootDir: string, packageJsonPath: string, result: DevScripts): DevScripts {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const scripts = packageJson.scripts || {};
  result.allScripts = scripts;

  // Detect package manager for install command
  if (existsSync(join(rootDir, 'pnpm-lock.yaml'))) {
    result.install = 'pnpm install';
  } else if (existsSync(join(rootDir, 'yarn.lock'))) {
    result.install = 'yarn';
  } else if (existsSync(join(rootDir, 'bun.lockb'))) {
    result.install = 'bun install';
  } else {
    result.install = 'npm install';
  }

  // Map common script names
  const devAliases = ['dev', 'start', 'serve', 'develop'];
  const buildAliases = ['build', 'compile', 'bundle'];
  const testAliases = ['test', 'test:unit', 'vitest', 'jest'];
  const lintAliases = ['lint', 'lint:fix', 'eslint', 'check'];

  for (const alias of devAliases) {
    if (scripts[alias]) { result.dev = `${result.install.split(' ')[0]} run ${alias}`; break; }
  }
  for (const alias of buildAliases) {
    if (scripts[alias]) { result.build = `${result.install.split(' ')[0]} run ${alias}`; break; }
  }
  for (const alias of testAliases) {
    if (scripts[alias]) { result.test = `${result.install.split(' ')[0]} run ${alias}`; break; }
  }
  for (const alias of lintAliases) {
    if (scripts[alias]) { result.lint = `${result.install.split(' ')[0]} run ${alias}`; break; }
  }

  return result;
}

function extractMakefileTargets(makefilePath: string, result: DevScripts): DevScripts {
  const content = readFileSync(makefilePath, 'utf-8');
  const targets = content.match(/^([a-zA-Z_-]+):/gm)?.map((t) => t.replace(':', '')) || [];

  result.allScripts = Object.fromEntries(targets.map((t) => [t, `make ${t}`]));

  if (targets.includes('install') || targets.includes('deps')) result.install = 'make install';
  if (targets.includes('dev') || targets.includes('run')) result.dev = 'make dev';
  if (targets.includes('build')) result.build = 'make build';
  if (targets.includes('test')) result.test = 'make test';
  if (targets.includes('lint')) result.lint = 'make lint';

  return result;
}

export function formatDevGuideSummary(scripts: DevScripts): string {
  const parts: string[] = [];
  if (scripts.install) parts.push(`\`${scripts.install}\`（安装依赖）`);
  if (scripts.dev) parts.push(`\`${scripts.dev}\`（启动开发服务器）`);
  if (scripts.build) parts.push(`\`${scripts.build}\`（构建生产版本）`);
  if (scripts.test) parts.push(`\`${scripts.test}\`（运行测试）`);
  if (scripts.lint) parts.push(`\`${scripts.lint}\`（代码检查）`);
  return `常用命令：${parts.join('、')}。`;
}
