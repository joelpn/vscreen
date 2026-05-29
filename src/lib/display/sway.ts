import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { VirtualDisplay } from "../../types/index.ts";

const execFileAsync = promisify(execFile);

interface SwayOutput {
	name: string;
	make: string;
	active: boolean;
	current_mode?: { width: number; height: number; refresh: number };
	rect: { width: number; height: number };
}

async function swaymsg(cmd: string): Promise<void> {
	await execFileAsync("swaymsg", ["-t", "command", cmd]);
}

async function getOutputs(): Promise<SwayOutput[]> {
	const { stdout } = await execFileAsync("swaymsg", ["-t", "get_outputs"]);
	return JSON.parse(stdout) as SwayOutput[];
}

export async function createSwayDisplay(
	resolution: string,
	refresh: number,
): Promise<VirtualDisplay> {
	await swaymsg("create_output");

	const outputs = await getOutputs();
	const headless = outputs.find((o) => o.name.startsWith("HEADLESS") || o.make === "Headless");

	if (!headless) {
		throw new Error("Failed to create headless output in Sway.");
	}

	await swaymsg(`output ${headless.name} resolution ${resolution}@${refresh}Hz`);
	await swaymsg(`output ${headless.name} enable`);

	return {
		id: headless.name,
		resolution,
		refresh,
		compositor: "sway",
		createdAt: new Date().toISOString(),
	};
}

export async function removeSwayDisplay(id: string): Promise<void> {
	try {
		await swaymsg(`output ${id} disable`);
	} catch {
		// Best-effort; output may already be gone
	}
}

export async function listSwayOutputs(): Promise<VirtualDisplay[]> {
	const outputs = await getOutputs();

	return outputs.map((o) => {
		const w = o.current_mode?.width ?? o.rect.width;
		const h = o.current_mode?.height ?? o.rect.height;
		const hz = o.current_mode ? Math.round(o.current_mode.refresh / 1000) : 60;

		return {
			id: o.name,
			resolution: `${w}x${h}`,
			refresh: hz,
			compositor: "sway" as const,
			createdAt: new Date().toISOString(),
		};
	});
}
