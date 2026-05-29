import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { VirtualDisplay } from "../../types/index.ts";

const execFileAsync = promisify(execFile);

interface HyprMonitor {
	name: string;
	width: number;
	height: number;
	refreshRate: number;
	disabled: boolean;
}

async function hyprctl(args: string[]): Promise<void> {
	await execFileAsync("hyprctl", args);
}

async function getMonitors(): Promise<HyprMonitor[]> {
	const { stdout } = await execFileAsync("hyprctl", ["-j", "monitors"]);
	return JSON.parse(stdout) as HyprMonitor[];
}

export async function createHyprlandDisplay(
	resolution: string,
	refresh: number,
	name = "HEADLESS-1",
): Promise<VirtualDisplay> {
	const rule = `${name},${resolution}@${refresh},auto,1`;
	await hyprctl(["keyword", "monitor", rule]);

	const monitors = await getMonitors();
	const created = monitors.find((m) => m.name === name) ?? monitors.at(-1);

	if (!created) {
		throw new Error("Failed to create virtual display in Hyprland.");
	}

	return {
		id: created.name,
		resolution: `${created.width}x${created.height}`,
		refresh: Math.round(created.refreshRate),
		compositor: "hyprland",
		createdAt: new Date().toISOString(),
	};
}

export async function removeHyprlandDisplay(id: string): Promise<void> {
	try {
		await hyprctl(["keyword", "monitor", `${id},disable`]);
	} catch {
		// Best-effort
	}
}

export async function listHyprlandOutputs(): Promise<VirtualDisplay[]> {
	const monitors = await getMonitors();

	return monitors
		.filter((m) => !m.disabled)
		.map((m) => ({
			id: m.name,
			resolution: `${m.width}x${m.height}`,
			refresh: Math.round(m.refreshRate),
			compositor: "hyprland" as const,
			createdAt: new Date().toISOString(),
		}));
}
