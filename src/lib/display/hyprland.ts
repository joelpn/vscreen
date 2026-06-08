import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { VirtualDisplay } from "../../types/index.ts";

const execFileAsync = promisify(execFile);

interface HyprMonitor {
	id: number;
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
	// Hyprland doesn't allow arbitrary names for headless outputs.
	// We must create it, let it assign a name like HEADLESS-1, and then set the rule.
	const prevMonitors = await getMonitors();
	await hyprctl(["output", "create", "headless"]);

	// Wait a moment for Hyprland to register the new output
	await new Promise((resolve) => setTimeout(resolve, 500));

	const currentMonitors = await getMonitors();
	// Find the newly created monitor
	const created = currentMonitors.find((m) => !prevMonitors.some((p) => p.id === m.id));

	if (!created) {
		throw new Error("Failed to create virtual display in Hyprland.");
	}

	// Now apply the resolution and refresh rate rule to the new monitor
	const rule = `${created.name},${resolution}@${refresh},auto,1`;
	await hyprctl(["keyword", "monitor", rule]);

	return {
		id: created.name,
		resolution,
		refresh,
		compositor: "hyprland",
		createdAt: new Date().toISOString(),
	};
}

export async function removeHyprlandDisplay(id: string): Promise<void> {
	try {
		await hyprctl(["output", "remove", id]);
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
