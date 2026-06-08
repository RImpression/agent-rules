import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export type ProjectType = 'react' | 'vue' | 'node' | 'java' | 'python' | 'go' | 'monorepo' | 'unknown';

interface ProjectTypeResult {
  type: ProjectType;
  framework: string;
  language: string;
  packageManager: string;
}

export function detectProjectType(rootDir: string): ProjectTypeResult {
  const result: ProjectTypeResult = {
    type: 'unknown',
    framework: '',
    language: '',
    packageManager: '',
  };

  // Detect package manager
  if (existsSync(join(rootDir, 'pnpm-lock.yaml'))) {
    result.packageManager = 'pnpm';
  } else if (existsSync(join(rootDir, 'yarn.lock'))) {
    result.packageManager = 'yarn';
  } else if (existsSync(join(rootDir, 'package-lock.json'))) {
    result.packageManager = 'npm';
  } else if (existsSync(join(rootDir, 'bun.lockb'))) {
    result.packageManager = 'bun';
  }

  // Node/JS project
  if (existsSync(join(rootDir, 'package.json'))) {
    const packageJson = readPackageJson(rootDir);
    result.language = existsSync(join(rootDir, 'tsconfig.json')) ? 'TypeScript' : 'JavaScript';

    // Detect monorepo
    if (packageJson.workspaces || existsSync(join(rootDir, 'pnpm-workspace.yaml')) || existsSync(join(rootDir, 'lerna.json'))) {
      result.type = 'monorepo';
      result.framework = detectJsFramework(packageJson);
      return result;
    }

    // Detect framework
    result.framework = detectJsFramework(packageJson);
    result.type = result.framework.toLowerCase().includes('react') || result.framework.toLowerCase().includes('next') ? 'react' :
      result.framework.toLowerCase().includes('vue') || result.framework.toLowerCase().includes('nuxt') ? 'vue' : 'node';
    return result;
  }

  // Java project
  if (existsSync(join(rootDir, 'pom.xml')) || existsSync(join(rootDir, 'build.gradle')) || existsSync(join(rootDir, 'build.gradle.kts'))) {
    result.type = 'java';
    result.language = 'Java';
    result.framework = existsSync(join(rootDir, 'pom.xml')) ? 'Maven' : 'Gradle';
    if (existsSync(join(rootDir, 'src/main/resources/application.yml')) || existsSync(join(rootDir, 'src/main/resources/application.properties'))) {
      result.framework = 'Spring Boot';
    }
    return result;
  }

  // Python project
  if (existsSync(join(rootDir, 'pyproject.toml')) || existsSync(join(rootDir, 'setup.py')) || existsSync(join(rootDir, 'requirements.txt'))) {
    result.type = 'python';
    result.language = 'Python';
    result.packageManager = existsSync(join(rootDir, 'poetry.lock')) ? 'poetry' :
      existsSync(join(rootDir, 'Pipfile')) ? 'pipenv' : 'pip';
    return result;
  }

  // Go project
  if (existsSync(join(rootDir, 'go.mod'))) {
    result.type = 'go';
    result.language = 'Go';
    result.packageManager = 'go modules';
    return result;
  }

  return result;
}

function readPackageJson(rootDir: string): Record<string, any> {
  try {
    return JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  } catch {
    return {};
  }
}

function detectJsFramework(packageJson: Record<string, any>): string {
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const frameworks: Array<[string, string]> = [
    ['next', 'Next.js'],
    ['nuxt', 'Nuxt'],
    ['@angular/core', 'Angular'],
    ['vue', 'Vue'],
    ['react', 'React'],
    ['svelte', 'Svelte'],
    ['express', 'Express'],
    ['fastify', 'Fastify'],
    ['koa', 'Koa'],
    ['nest', 'NestJS'],
  ];

  const detected: string[] = [];
  for (const [dep, name] of frameworks) {
    if (allDeps[dep]) {
      detected.push(name);
    }
  }
  return detected.join(' + ') || 'Node.js';
}
