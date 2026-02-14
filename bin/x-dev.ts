#!/usr/bin/env ts-node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';

const program = new Command();

program
  .name('x-dev')
  .description('Modular Development Framework CLI')
  .version('1.0.0');

program
  .command('run <recipe>')
  .description('Run a recipe')
  .action((recipe) => {
    console.log(chalk.green(`Starting recipe: ${recipe}`));
    
    // Check if recipe exists
    const recipePath = path.resolve(process.cwd(), 'recipes', `${recipe}.json`);
    if (!fs.existsSync(recipePath)) {
      console.error(chalk.red(`Recipe not found: ${recipePath}`));
      process.exit(1);
    }
    
    console.log(chalk.blue(`Found recipe at: ${recipePath}`));
    
    try {
        const recipeContent = fs.readFileSync(recipePath, 'utf-8');
        const recipeJson = JSON.parse(recipeContent);
        console.log(chalk.gray(JSON.stringify(recipeJson, null, 2)));
        console.log(chalk.yellow('Orchestration logic not yet implemented.'));
    } catch (error) {
        console.error(chalk.red('Failed to parse recipe:'), error);
    }
  });

program
  .command('ps')
  .description('List running blocks')
  .action(() => {
    console.log('No blocks running (mock).');
  });

program.parse(process.argv);
