import * as fs from 'fs';
import * as path from 'path';

export interface ProcessState {
    name: string;
    blockId: string;
    pid: number;
    port: number;
    startTime: number;
    status: 'running' | 'stopped' | 'error';
}

export class StateManager {
    private statePath: string;

    constructor(projectRoot: string) {
        const stateDir = path.join(projectRoot, '.x-dev');
        if (!fs.existsSync(stateDir)) {
            fs.mkdirSync(stateDir, { recursive: true });
        }
        this.statePath = path.join(stateDir, 'state.json');
    }

    public getState(): ProcessState[] {
        if (!fs.existsSync(this.statePath)) {
            return [];
        }
        try {
            return JSON.parse(fs.readFileSync(this.statePath, 'utf-8'));
        } catch (e) {
            return [];
        }
    }

    public saveState(processes: ProcessState[]) {
        fs.writeFileSync(this.statePath, JSON.stringify(processes, null, 2));
    }

    public addProcess(proc: ProcessState) {
        let current = this.getState();
        // Remove existing if any (cleanup)
        current = current.filter(p => p.name !== proc.name);
        current.push(proc);
        this.saveState(current);
    }

    public removeProcess(name: string) {
        let current = this.getState();
        current = current.filter(p => p.name !== name);
        this.saveState(current);
    }

    public clear() {
        if (fs.existsSync(this.statePath)) {
            fs.unlinkSync(this.statePath);
        }
    }
}
