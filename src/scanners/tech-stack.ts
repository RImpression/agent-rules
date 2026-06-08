import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface TechStackInfo {
  runtime: string;
  language: string;
  framework: string;
  stateManagement: string;
  cssFramework: string;
  testFramework: string;
  bundler: string;
  linter: string;
  majorDependencies: Array<{ name: string; version: string }>;
}

export function extractTechStack(rootDir: string): TechStackInfo {
  const result: TechStackInfo = {
    runtime: '',
    language: '',
    framework: '',
    stateManagement: '',
    cssFramework: '',
    testFramework: '',
    bundler: '',
    linter: '',
    majorDependencies: [],
  };

  const packageJsonPath = join(rootDir, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return extractNonJsTechStack(rootDir, result);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  // Runtime & Language
  result.runtime = 'Node.js';
  result.language = existsSync(join(rootDir, 'tsconfig.json')) ? `TypeScript ${allDeps['typescript'] || ''}`.trim() : 'JavaScript';

  // Framework
  const frameworkMap: Record<string, string> = {
    'next': 'Next.js', 'nuxt': 'Nuxt', 'vue': 'Vue', 'react': 'React',
    '@angular/core': 'Angular', 'svelte': 'Svelte', 'express': 'Express',
    'fastify': 'Fastify', 'koa': 'Koa', '@nestjs/core': 'NestJS',
  };
  for (const [dep, name] of Object.entries(frameworkMap)) {
    if (allDeps[dep]) {
      result.framework = `${name} ${allDeps[dep]}`;
      break;
    }
  }

  // State Management
  const stateMap: Record<string, string> = {
    'valtio': 'Valtio', 'zustand': 'Zustand', 'redux': 'Redux',
    '@reduxjs/toolkit': 'Redux Toolkit', 'mobx': 'MobX', 'pinia': 'Pinia', 'vuex': 'Vuex',
  };
  for (const [dep, name] of Object.entries(stateMap)) {
    if (allDeps[dep]) {
      result.stateManagement = `${name} ${allDeps[dep]}`;
      break;
    }
  }

  // CSS Framework
  const cssMap: Record<string, string> = {
    'tailwindcss': 'Tailwind CSS', 'styled-components': 'Styled Components',
    '@emotion/react': 'Emotion', 'sass': 'SCSS', 'less': 'Less',
    'antd': 'Ant Design', '@mui/material': 'Material UI',
  };
  const cssFrameworks: string[] = [];
  for (const [dep, name] of Object.entries(cssMap)) {
    if (allDeps[dep]) cssFrameworks.push(`${name} ${allDeps[dep]}`);
  }
  result.cssFramework = cssFrameworks.join(' + ');

  // Test Framework
  const testMap: Record<string, string> = {
    'vitest': 'Vitest', 'jest': 'Jest', '@playwright/test': 'Playwright',
    'cypress': 'Cypress', 'mocha': 'Mocha',
  };
  for (const [dep, name] of Object.entries(testMap)) {
    if (allDeps[dep]) {
      result.testFramework = `${name} ${allDeps[dep]}`;
      break;
    }
  }

  // Bundler
  const bundlerMap: Record<string, string> = {
    'vite': 'Vite', 'webpack': 'Webpack', 'esbuild': 'esbuild',
    'tsup': 'tsup', 'rollup': 'Rollup', 'turbopack': 'Turbopack',
  };
  for (const [dep, name] of Object.entries(bundlerMap)) {
    if (allDeps[dep]) {
      result.bundler = `${name} ${allDeps[dep]}`;
      break;
    }
  }

  // Linter
  if (allDeps['eslint']) result.linter = `ESLint ${allDeps['eslint']}`;
  if (allDeps['biome'] || allDeps['@biomejs/biome']) result.linter = 'Biome';

  // Major deps (top 10 by relevance)
  const ignoreDeps = new Set([
    'typescript', 'eslint', 'prettier', '@types/node', '@types/react',
  ]);
  const deps = Object.entries(packageJson.dependencies || {})
    .filter(([name]) => !ignoreDeps.has(name))
    .slice(0, 10)
    .map(([name, version]) => ({ name, version: version as string }));
  result.majorDependencies = deps;

  return result;
}

function extractNonJsTechStack(rootDir: string, result: TechStackInfo): TechStackInfo {
  if (existsSync(join(rootDir, 'go.mod'))) {
    result.runtime = 'Go';
    result.language = 'Go';
    const goMod = readFileSync(join(rootDir, 'go.mod'), 'utf-8');
    const goVersion = goMod.match(/^go\s+(\S+)/m);
    if (goVersion) result.runtime = `Go ${goVersion[1]}`;
  } else if (existsSync(join(rootDir, 'pom.xml'))) {
    result.runtime = 'JVM';
    result.language = 'Java';
    result.framework = 'Spring Boot (Maven)';
  } else if (existsSync(join(rootDir, 'pyproject.toml'))) {
    result.runtime = 'Python';
    result.language = 'Python';
  }
  return result;
}

export function formatTechStackSummary(info: TechStackInfo): string {
  const parts: string[] = [];
  if (info.framework) parts.push(info.framework);
  if (info.language) parts.push(info.language);
  if (info.stateManagement) parts.push(info.stateManagement);
  if (info.cssFramework) parts.push(info.cssFramework);
  if (info.testFramework) parts.push(info.testFramework);
  if (info.bundler) parts.push(info.bundler);
  if (info.linter) parts.push(info.linter);
  return parts.join(' + ') || 'Unknown';
}
