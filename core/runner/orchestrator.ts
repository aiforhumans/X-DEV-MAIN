import * as fs from 'fs';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import chalk from 'chalk';
import { z } from 'zod';
import { RecipeSchema } from '../schemas/recipe.schema';
import { BlockManifestSchema } from '../schemas/block.schema';
import { StateManager } from '../state/state-manager';

interface RunningService {
    name: string;
    process: ChildProcess;
    pid: number;
}

export class Orchestrator {
    private services: RunningService[] = [];
    private projectRoot: string;
    private stateManager: StateManager;

    constructor(projectRoot: string) {
        this.projectRoot = projectRoot;
        this.stateManager = new StateManager(projectRoot);
    }

    public async runRecipe(recipeName: string) {
        console.log(chalk.blue(`[Orchestrator] Loading recipe: ${recipeName}`));
        
        const recipePath = path.join(this.projectRoot, 'recipes', `${recipeName}.json`);
        
        if (!fs.existsSync(recipePath)) {
             console.error(chalk.red(`[Error] Recipe file not found: ${recipePath}`));
             return;
        }

        try {
            const rawRecipe = JSON.parse(fs.readFileSync(recipePath, 'utf-8'));
            const result = RecipeSchema.safeParse(rawRecipe);

            if (!result.success) {
                console.error(chalk.red('Invalid Recipe Format:'), JSON.stringify(result.error.format(), null, 2));
                return;
            }

            const recipe = result.data;
            console.log(chalk.green(`[Orchestrator] Starting Application: ${recipe.name}`));

            // Clear previous state on new run
            this.stateManager.clear();

            if (!recipe.blocks) {
                console.log(chalk.yellow('No blocks defined in recipe.'));
                return;
            }

            for (const [serviceName, config] of Object.entries(recipe.blocks)) {
                await this.spawnBlock(serviceName, config);
            }

            console.log(chalk.yellow('[Orchestrator] All services started. Press Ctrl+C to stop.'));

            // Handle clean exit
            process.on('SIGINT', () => {
                console.log(chalk.yellow('\nStopping all services...'));
                this.services.forEach(s => s.process.kill());
                this.stateManager.clear();
                process.exit();
            });

        } catch (e: any) {
            console.error(chalk.red(`Failed to parse recipe JSON: ${e.message}`));
        }
    }

    private async spawnBlock(serviceName: string, config: any) {
        const blockId = config.blockId;
        const blockDir = path.join(this.projectRoot, 'blocks', blockId);
        const manifestPath = path.join(blockDir, 'block.json');

        if (!fs.existsSync(manifestPath)) {
            console.error(chalk.red(`[Error] Block not found: ${blockId} (expected at ${blockDir})`));
            return;
        }

        let manifest;
        try {
            const rawManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
            const manifestResult = BlockManifestSchema.safeParse(rawManifest);

            if (!manifestResult.success) {
                console.error(chalk.red(`[Error] Invalid Manifest for ${blockId}:`), JSON.stringify(manifestResult.error.format(), null, 2));
                return;
            }
            manifest = manifestResult.data;
        } catch (e: any) {
            console.error(chalk.red(`[Error] Failed to read manifest for ${blockId}: ${e.message}`));
            return;
        }

        // Calculate ENV
        const port = config.port || (manifest.expose?.port?.default) || 3000;
        
        const env = { 
            ...process.env,
            ...config.env, 
            PORT: port.toString()
        };

        // Determine Command
        let runCmd = 'echo "No run command"';
        if (manifest.scripts && manifest.scripts.start) {
            runCmd = manifest.scripts.start;
        } else if (manifest.runCommand) {
            runCmd = manifest.runCommand;
        }
        
        const color = this.getColorForService(serviceName);
        console.log(color(`[${serviceName}] Starting ${blockId} on port ${port}...`));

        const child = spawn(runCmd, {
            cwd: blockDir,
            shell: true,
            env: env as NodeJS.ProcessEnv,
            stdio: 'pipe'
        });

        if (child.pid) {
            this.services.push({ name: serviceName, process: child, pid: child.pid });
            
            // Register state
            this.stateManager.addProcess({
                name: serviceName,
                blockId: blockId,
                pid: child.pid,
                port: Number(port),
                startTime: Date.now(),
                status: 'running'
            });

            child.stdout?.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach((line: string) => {
                    if (line.trim()) console.log(color(`[${serviceName}] ${line.trim()}`));
                });
            });

            child.stderr?.on('data', (data) => {
                const lines = data.toString().split('\n');
                lines.forEach((line: string) => {
                    if (line.trim()) console.error(color(`[${serviceName}] ERR: ${line.trim()}`));
                });
            });

            child.on('close', (code) => {
                console.log(chalk.red(`[${serviceName}] Process exited with code ${code}`));
                this.stateManager.removeProcess(serviceName);
            });
             
             child.on('error', (err) => {
                console.error(chalk.red(`[${serviceName}] Process Error: ${err.message}`));
                this.stateManager.removeProcess(serviceName);
            });
        }
    }

    private getColorForService(name: string) {
        const colors = [chalk.cyan, chalk.magenta, chalk.green, chalk.yellow, chalk.blue];
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
}
