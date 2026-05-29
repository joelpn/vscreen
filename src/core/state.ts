import { EventEmitter } from "node:events";
import type { AdbTunnel, VirtualDisplay, VncServer, VScreenState } from "../types/index.js";

const DEFAULT_STATE: VScreenState = {
	display: null,
	vnc: null,
	adb: null,
	isRunning: false,
};

class StateManager extends EventEmitter {
	private state: VScreenState = { ...DEFAULT_STATE };

	get<K extends keyof VScreenState>(key: K): VScreenState[K] {
		return this.state[key];
	}

	set<K extends keyof VScreenState>(key: K, value: VScreenState[K]): void {
		const prev = this.state[key];
		this.state[key] = value;
		this.emit("change", { key, prev, next: value });
		this.emit(`change:${key}`, { prev, next: value });
	}

	getAll(): Readonly<VScreenState> {
		return { ...this.state };
	}

	setDisplay(display: VirtualDisplay | null): void {
		this.set("display", display);
	}

	setVnc(vnc: VncServer | null): void {
		this.set("vnc", vnc);
	}

	setAdb(adb: AdbTunnel | null): void {
		this.set("adb", adb);
	}

	setRunning(running: boolean): void {
		this.set("isRunning", running);
	}

	reset(): void {
		for (const key of Object.keys(DEFAULT_STATE) as (keyof VScreenState)[]) {
			this.set(key, DEFAULT_STATE[key] as VScreenState[typeof key]);
		}
	}

	isActive(): boolean {
		return this.state.isRunning && this.state.display !== null;
	}
}

export const state = new StateManager();
