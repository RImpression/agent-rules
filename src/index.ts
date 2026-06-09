#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { refreshCommand } from './commands/refresh.js';
import { doctorCommand } from './commands/doctor.js';
import { setupSkillCommand } from './commands/setup-skill.js';
import { syncCommand } from './commands/sync.js';

const program = new Command();

program
  .name('arules')
  .description('Generate AI-readable project specifications (.agents/ directory)')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize .agents/ directory with project specifications')
  .option('-f, --force', 'Force overwrite existing files')
  .option('--merge', 'Merge with existing files (keep user customizations)')
  .option('-t, --template <type>', 'Project template (react, node, java, monorepo)', 'auto')
  .option('-p, --platform <platforms>', 'Generate platform configs (cursor,claude,copilot,windsurf,codex,gemini,aone-copilot or "all")')
  .option('--dry-run', 'Preview changes without writing files')
  .action(initCommand);

program
  .command('add')
  .description('Add a new rule, skill, or module-map')
  .argument('<type>', 'Type to add: rule | skill | module')
  .argument('<name>', 'Name of the item to add')
  .option('-d, --description <desc>', 'Brief description')
  .action(addCommand);

program
  .command('refresh')
  .description('Re-scan project structure and update overview files')
  .option('--full', 'Also refresh all module-maps')
  .action(refreshCommand);

program
  .command('doctor')
  .description('Check specification completeness and broken references')
  .action(doctorCommand);

program
  .command('sync')
  .description('Generate or update platform-specific config files (Cursor, Claude, Copilot, etc.)')
  .option('-p, --platform <platforms>', 'Platforms to sync (cursor,claude,copilot,windsurf,codex,gemini,aone-copilot or "all")')
  .option('-f, --force', 'Force overwrite existing platform config files')
  .option('--dry-run', 'Preview changes without writing files')
  .option('--clean', 'Remove all platform config files')
  .action(syncCommand);

program
  .command('setup-skill')
  .description('Install the AI enhancement Skill for intelligent spec generation')
  .option('-g, --global', 'Install to global skill directory (~/.agents/skills/)')
  .option('-l, --local', 'Install to current project .agents/skills/ (default)')
  .action(setupSkillCommand);

program.parse();
