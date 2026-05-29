import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { DepCheckResult, DepStatus } from "../types/index.ts";

const execFileAsync = promisify(execFile);

const REQUIRED: readonly string[] = ["wayvnc", "adb"];
const OPTIONAL: readonly string[] = ["wlr-randr", "hyprctl", "swaymsg", "niri"];

async function checkBinary(name: string): Promise<DepStatus> {
	try {
		await execFileAsync("which", [name]);
		return { name, available: true };
	} catch {
		return { name, available: false };
	}
}

export async function checkDeps(): Promise<DepCheckResult> {
	const [required, optional] = await Promise.all([
		Promise.all(REQUIRED.map(checkBinary)),
		Promise.all(OPTIONAL.map(checkBinary)),
	]);

	const missing = required.filter((d) => !d.available).map((d) => d.name);

	return {
		required,
		optional,
		ok: missing.length === 0,
		missing,
	};
}

export async function assertDeps(names: string[]): Promise<void> {
	const results = await Promise.all(names.map(checkBinary));
	const missing = results.filter((d) => !d.available).map((d) => d.name);

	if (missing.length > 0) {
		throw new Error(
			`Missing required dependencies: ${missing.join(", ")}\n` +
				`Install them with your package manager and try again.`,
		);
	}
}
