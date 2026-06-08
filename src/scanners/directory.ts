import fg from 'fast-glob';
import { basename, relative } from 'node:path';

export interface DirectoryNode {
  name: string;
  path: string;
  type: 'dir' | 'file';
  children?: DirectoryNode[];
}

export interface SourceStructure {
  topLevelDirs: string[];
  srcDirs: string[];
  tree: DirectoryNode[];
  totalFiles: number;
}

const DEFAULT_IGNORE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/out/**',
  '**/.next/**',
  '**/.nuxt/**',
  '**/target/**',
  '**/__pycache__/**',
  '**/venv/**',
  '**/.venv/**',
  '**/coverage/**',
  '**/.agents/**',
];

export async function scanDirectory(rootDir: string, maxDepth = 3): Promise<SourceStructure> {
  // Scan top-level directories separately to handle empty dirs
  const topLevelDirs = await fg(['*/'], {
    cwd: rootDir,
    onlyDirectories: true,
    deep: 1,
    ignore: DEFAULT_IGNORE,
    dot: false,
  }).then((dirs) => dirs.map((d) => d.replace(/\/$/, '')));

  const srcDirs = detectSourceDirs(topLevelDirs, rootDir);

  // Scan all entries for tree building
  const entries = await fg(['**/*'], {
    cwd: rootDir,
    onlyFiles: false,
    deep: maxDepth,
    ignore: DEFAULT_IGNORE,
    markDirectories: true,
    dot: false,
  });

  const tree = buildTree(entries, rootDir, 2);

  const allFiles = await fg(['**/*'], {
    cwd: rootDir,
    onlyFiles: true,
    ignore: DEFAULT_IGNORE,
    dot: false,
  });

  return {
    topLevelDirs,
    srcDirs,
    tree,
    totalFiles: allFiles.length,
  };
}

function detectSourceDirs(topLevelDirs: string[], _rootDir: string): string[] {
  const commonSrcDirs = ['src', 'lib', 'app', 'pages', 'components', 'packages', 'modules', 'cmd', 'internal', 'pkg'];
  return topLevelDirs.filter((dir) => commonSrcDirs.includes(dir));
}

function buildTree(entries: string[], rootDir: string, maxDepth: number): DirectoryNode[] {
  const root: DirectoryNode[] = [];
  const dirMap = new Map<string, DirectoryNode>();

  for (const entry of entries) {
    const parts = entry.replace(/\/$/, '').split('/');
    if (parts.length > maxDepth + 1) continue;

    const isDir = entry.endsWith('/');
    const node: DirectoryNode = {
      name: basename(entry.replace(/\/$/, '')),
      path: relative(rootDir, entry).replace(/\/$/, ''),
      type: isDir ? 'dir' : 'file',
    };

    if (isDir) {
      node.children = [];
      dirMap.set(entry.replace(/\/$/, ''), node);
    }

    if (parts.length === 1) {
      root.push(node);
    } else {
      const parentPath = parts.slice(0, -1).join('/');
      const parent = dirMap.get(parentPath);
      if (parent?.children) {
        parent.children.push(node);
      }
    }
  }

  return root;
}

export function formatDirectoryTree(tree: DirectoryNode[], indent = ''): string {
  const lines: string[] = [];
  for (const node of tree) {
    const prefix = node.type === 'dir' ? `${node.name}/` : node.name;
    lines.push(`${indent}${prefix}`);
    if (node.children && node.children.length > 0) {
      lines.push(formatDirectoryTree(node.children, indent + '  '));
    }
  }
  return lines.join('\n');
}

export function formatSourceStructureSummary(structure: SourceStructure): string {
  const dirList = structure.srcDirs.map((dir) => `\`${dir}/\``).join('、');
  return `源码主要分布在 ${dirList}，共 ${structure.totalFiles} 个文件。顶层目录包含：${structure.topLevelDirs.map((d) => `\`${d}/\``).join('、')}。`;
}
