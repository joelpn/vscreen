import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Compositor, CompositorFamily } from "../types/index.ts";

const execFileAsync = promisify(execFile);

async function envHint(): Promise<Compositor | null> {
	const desktop = process.env.XDG_CURRENT_DESKTOP?.toLowerCase() ?? "";
	const session = process.env.DESKTOP_SESSION?.toLowerCase() ?? "";
	const combined = `${desktop} ${session}`;

	if (combined.includes("hyprland")) return "hyprland";
	if (combined.includes("sway")) return "sway";
	if (combined.includes("wayfire")) return "wayfire";
	if (combined.includes("river")) return "river";
	if (combined.includes("labwc")) return "labwc";
	if (combined.includes("niri")) return "niri";
	if (combined.includes("gnome")) return "gnome";
	if (combined.includes("kde") || combined.includes("plasma")) return "kde";

	return null;
}

async function probeProcess(name: string): Promise<boolean> {
	try {
		await execFileAsync("pgrep", ["-x", name]);
		return true;
	} catch {
		return false;
	}
}

export async function detectCompositor(): Promise<Compositor> {
	const hint = await envHint();
	if (hint) return hint;

	const candidates: [string, Compositor][] = [
		["Hyprland", "hyprland"],
		["sway", "sway"],
		["wayfire", "wayfire"],
		["river", "river"],
		["labwc", "labwc"],
		["niri", "niri"],
		["gnome-shell", "gnome"],
		["kwin_wayland", "kde"],
	];

	const results = await Promise.all(candidates.map(([bin]) => probeProcess(bin)));

	for (let i = 0; i < results.length; i++) {
		if (results[i]) return candidates[i]![1];
	}

	return "unknown";
}

export function compositorFamily(compositor: Compositor): CompositorFamily {
	switch (compositor) {
		case "sway":
		case "hyprland":
		case "wayfire":
		case "river":
		case "labwc":
		case "niri":
			return "wlroots";
		case "gnome":
			return "mutter";
		case "kde":
			return "kwin";
		default:
			return "unknown";
	}
}

export function isWlrBased(compositor: Compositor): boolean {
	return compositorFamily(compositor) === "wlroots";
}