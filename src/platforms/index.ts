export interface PlatformConfig {
  /** Platform identifier */
  name: string;
  /** Human-readable display name */
  displayName: string;
  /** Config file path relative to project root */
  filePath: string;
  /** Generate the platform-specific config content */
  generateContent: (projectName: string) => string;
}

/**
 * All platform configs generate a "forwarding" file that points AI agents
 * to the canonical AGENTS.md entry point, following the design principle:
 * "其他 Agent 入口文件只能作为转发入口"
 */

const cursorPlatform: PlatformConfig = {
  name: 'cursor',
  displayName: 'Cursor',
  filePath: '.cursorrules',
  generateContent: (projectName) => `# ${projectName} — Cursor Rules

Read AGENTS.md at the repository root before starting any task.
AGENTS.md is the single source of truth for all AI behavior in this project.

All rules, overviews, skills, and workflows are defined under \`.agents/\`.
`,
};

const claudePlatform: PlatformConfig = {
  name: 'claude',
  displayName: 'Claude Code',
  filePath: 'CLAUDE.md',
  generateContent: (projectName) => `# ${projectName} — Claude Code Instructions

Read AGENTS.md at the repository root before starting any task.
AGENTS.md is the single source of truth for all AI behavior in this project.

All rules, overviews, skills, and workflows are defined under \`.agents/\`.

## Quick Reference

- **Rules index**: \`.agents/rules/rule.md\`
- **Project overview**: \`.agents/overviews/overview.md\`
- **Glossary**: \`.agents/overviews/glossary.md\`
`,
};

const copilotPlatform: PlatformConfig = {
  name: 'copilot',
  displayName: 'GitHub Copilot',
  filePath: '.github/copilot-instructions.md',
  generateContent: (projectName) => `# ${projectName} — GitHub Copilot Instructions

Read AGENTS.md at the repository root before starting any task.
AGENTS.md is the single source of truth for all AI behavior in this project.

All rules, overviews, skills, and workflows are defined under \`.agents/\`.
`,
};

const windsurfPlatform: PlatformConfig = {
  name: 'windsurf',
  displayName: 'Windsurf',
  filePath: '.windsurfrules',
  generateContent: (projectName) => `# ${projectName} — Windsurf Rules

Read AGENTS.md at the repository root before starting any task.
AGENTS.md is the single source of truth for all AI behavior in this project.

All rules, overviews, skills, and workflows are defined under \`.agents/\`.
`,
};

const codexPlatform: PlatformConfig = {
  name: 'codex',
  displayName: 'OpenAI Codex',
  filePath: 'codex.md',
  generateContent: (projectName) => `# ${projectName} — Codex Instructions

Read AGENTS.md at the repository root before starting any task.
AGENTS.md is the single source of truth for all AI behavior in this project.

All rules, overviews, skills, and workflows are defined under \`.agents/\`.
`,
};

const geminiPlatform: PlatformConfig = {
  name: 'gemini',
  displayName: 'Gemini',
  filePath: 'GEMINI.md',
  generateContent: (projectName) => `# ${projectName} — Gemini Instructions

Read AGENTS.md at the repository root before starting any task.
AGENTS.md is the single source of truth for all AI behavior in this project.

All rules, overviews, skills, and workflows are defined under \`.agents/\`.
`,
};

const aoneCopilotPlatform: PlatformConfig = {
  name: 'aone-copilot',
  displayName: 'Aone Copilot',
  filePath: '.aone_copilot/rules/agent-rules.md',
  generateContent: (projectName) => `# ${projectName} — Aone Copilot Rules

Read AGENTS.md at the repository root before starting any task.
AGENTS.md is the single source of truth for all AI behavior in this project.

All rules, overviews, skills, and workflows are defined under \`.agents/\`.
`,
};

export const ALL_PLATFORMS: PlatformConfig[] = [
  cursorPlatform,
  claudePlatform,
  copilotPlatform,
  windsurfPlatform,
  codexPlatform,
  geminiPlatform,
  aoneCopilotPlatform,
];

export const PLATFORM_MAP = new Map<string, PlatformConfig>(
  ALL_PLATFORMS.map((platform) => [platform.name, platform]),
);

/**
 * Parse a comma-separated platform list. Supports "all" to select every platform.
 */
export function parsePlatformList(input: string): PlatformConfig[] {
  if (input.trim().toLowerCase() === 'all') {
    return [...ALL_PLATFORMS];
  }

  const names = input.split(',').map((name) => name.trim().toLowerCase());
  const platforms: PlatformConfig[] = [];
  const unknown: string[] = [];

  for (const name of names) {
    const platform = PLATFORM_MAP.get(name);
    if (platform) {
      platforms.push(platform);
    } else {
      unknown.push(name);
    }
  }

  if (unknown.length > 0) {
    const available = ALL_PLATFORMS.map((p) => p.name).join(', ');
    throw new Error(
      `Unknown platform(s): ${unknown.join(', ')}. Available: ${available}`,
    );
  }

  return platforms;
}
