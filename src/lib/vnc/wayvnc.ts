import { type ChildProcess, execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import type { VncServer } from "../../types/index.ts";

const execFileAsync = promisify(execFile);

/** Active wayvnc child process, if any. */
let wayvncProcess: ChildProcess | null = null;

/**
 * Start wayvnc bound to a specific output (display) and port.
 *
 * Spawns wayvnc as a detached child so it survives brief parent
 * interruptions.  We keep a reference to stop it cleanly later.
 */
export async function startWayvnc(
	displayId: string,
	port: number,
): Promise<VncServer> {
	if (wayvncProcess) {
		throw new Error(
			"wayvnc is already running. Stop the current session before starting a new one.",
		);
	}

	const args = [
		"--output",
		displayId,
		"--render-cursor",
		"0.0.0.0",
		String(port),
	];

	const child = spawn("wayvnc", args, {
		detached: true,
		stdio: ["ignore", "pipe", "pipe"],
	});

	// Give wayvnc a moment to either fail or start listening
	await new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			child.stderr?.removeAllListeners();
			resolve();
		}, 800);

		child.on("error", (err) => {
			clearTimeout(timeout);
			wayvncProcess = null;
			reject(new Error(`Failed to start wayvnc: ${err.message}`));
		});

		child.on("exit", (code) => {
			if (code !== null && code !== 0) {
				clearTimeout(timeout);
				wayvncProcess = null;
				reject(new Error(`wayvnc exited immediately with code ${code}`));
			}
		});
	});

	wayvncProcess = child;

	return {
		displayId,
		port,
		pid: child.pid,
		running: true,
		startedAt: new Date().toISOString(),
	};
}

/**
 * Stop the running wayvnc instance.
 *
 * Sends SIGTERM first; falls back to SIGKILL if the process
 * does not exit within 2 seconds.
 */
export async function stopWayvnc(): Promise<void> {
	if (!wayvncProcess) return;

	const child = wayvncProcess;
	wayvncProcess = null;

	child.kill("SIGTERM");

	await new Promise<void>((resolve) => {
		const timeout = setTimeout(() => {
			try {
				child.kill("SIGKILL");
			} catch {
				// Already dead — ignore
			}
			resolve();
		}, 2000);

		child.on("exit", () => {
			clearTimeout(timeout);
			resolve();
		});
	});
}

/**
 * Check whether the managed wayvnc child process is still alive.
 */
export function isWayvncRunning(): boolean {
	if (!wayvncProcess || wayvncProcess.exitCode !== null) {
		wayvncProcess = null;
		return false;
	}
	return true;
}

/**
 * Try to detect an externally-started wayvnc process by looking
 * at the system process list.  Returns the PID if found, `null` otherwise.
 */
export async function findExternalWayvnc(): Promise<number | null> {
	try {
		const { stdout } = await execFileAsync("pgrep", ["-x", "wayvnc"]);
		const pid = Number.parseInt(stdout.trim(), 10);
		return Number.isNaN(pid) ? null : pid;
	} catch {
		return null;
	}
}
