import chalk from 'chalk';

export const logger = {
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  },

  success(message: string): void {
    console.log(chalk.green('✔'), message);
  },

  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  },

  error(message: string): void {
    console.log(chalk.red('✖'), message);
  },

  file(action: string, path: string): void {
    const actionColor = action === 'created' ? chalk.green :
      action === 'skipped' ? chalk.gray :
      action === 'overwritten' ? chalk.yellow :
      chalk.cyan;
    console.log(`  ${actionColor(action.padEnd(11))} ${path}`);
  },

  heading(title: string): void {
    console.log('');
    console.log(chalk.bold(title));
    console.log(chalk.gray('─'.repeat(40)));
  },

  dryRun(message: string): void {
    console.log(chalk.magenta('[dry-run]'), message);
  },
};
