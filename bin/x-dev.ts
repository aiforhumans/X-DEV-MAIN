#!/usr/bin/env ts-node

import { Command } from 'commander';
import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { Orchestrator } from '../core/runner/orchestrator';
import { StateManager } from '../core/state/state-manager';

const program = new Command();

program
  .name('x-dev')
  .description('Modular Development Framework CLI')
  .version('1.0.0');

const projectRoot = process.cwd();

program
  .command('run <recipe>')
  .description('Run a recipe')
  .action(async (recipeName) => {
    try {
        const orchestrator = new Orchestrator(projectRoot);
        await orchestrator.runRecipe(recipeName);
    } catch (error) {
        if (error instanceof Error) {
            console.error(chalk.red('[Orchestrator Error]'), error.message);
        }
        process.exit(1);
    }
  });

program
  .command('ps')
  .description('List running blocks')
  .action(() => {
    const stateManager = new StateManager(projectRoot);
    const processes = stateManager.getState();

    if (processes.length === 0) {
        console.log(chalk.yellow('No active blocks found.'));
        return;
    }

    console.log(chalk.bold('Running Blocks:'));
    console.log(chalk.dim('------------------------------------------------------------'));
    console.log(
        chalk.cyan('Name'.padEnd(15)) + 
        chalk.green('Block ID'.padEnd(15)) + 
        chalk.yellow('Port'.padEnd(10)) + 
        chalk.magenta('PID'.padEnd(10)) + 
        'Status'
    );
    console.log(chalk.dim('------------------------------------------------------------'));

    processes.forEach(proc => {
        console.log(
            proc.name.padEnd(15) + 
            proc.blockId.padEnd(15) + 
            proc.port.toString().padEnd(10) + 
            proc.pid.toString().padEnd(10) + 
            proc.status
        );
    });
  });

program.parse(process.argv);
