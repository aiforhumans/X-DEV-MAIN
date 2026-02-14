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

program
  .command('create <blockId>')
  .description('Create a new Dev-Block template')
  .option('-t, --type <type>', 'Block type (frontend|backend|worker|database)', 'backend')
  .option('-p, --port <port>', 'Default block port')
  .action((blockId: string, options: { type?: string; port?: string }) => {
    const supportedTypes = ['frontend', 'backend', 'worker', 'database'] as const;
    const blockType = (options.type || 'backend').toLowerCase();

    if (!supportedTypes.includes(blockType as (typeof supportedTypes)[number])) {
      console.error(chalk.red(`[Error] Unsupported block type: ${blockType}`));
      console.error(chalk.yellow(`Supported types: ${supportedTypes.join(', ')}`));
      process.exit(1);
    }

    const defaultPort = blockType === 'frontend' ? 3000 : 4000;
    const parsedPort = Number(options.port ?? defaultPort);
    if (!Number.isFinite(parsedPort) || parsedPort <= 0) {
      console.error(chalk.red(`[Error] Invalid port: ${options.port}`));
      process.exit(1);
    }

    const blockDir = path.join(projectRoot, 'blocks', blockId);
    const manifestPath = path.join(blockDir, 'block.json');

    if (fs.existsSync(manifestPath)) {
      console.error(chalk.red(`[Error] Block already exists: ${blockId}`));
      process.exit(1);
    }

    fs.mkdirSync(blockDir, { recursive: true });

    const runCommand =
      blockType === 'frontend'
        ? `node -e "console.log('Frontend block running on port ' + process.env.PORT + ' API=' + (process.env.API_URL || 'not-set')); setInterval(() => {}, 1000);"`
        : `node -e "console.log('${blockType} block running on port ' + process.env.PORT); setInterval(() => {}, 1000);"`;

    const env: Record<string, { description?: string; required?: boolean; default?: string | number | boolean }> = {
      PORT: { required: true },
    };

    if (blockType === 'frontend') {
      env.API_URL = {
        description: 'The backend endpoint',
        required: false,
        default: 'http://localhost:4000',
      };
    }

    const manifest = {
      schemaVersion: '1.0',
      id: blockId,
      version: '1.0.0',
      type: blockType,
      description: `Template ${blockType} block`,
      runCommand,
      env,
      expose: {
        port: {
          default: parsedPort,
          protocol: 'http',
        },
      },
    };

    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
    console.log(chalk.green(`[Create] Block created: ${blockId}`));
    console.log(chalk.cyan(`[Create] Manifest: ${manifestPath}`));
  });

program.parse(process.argv);
