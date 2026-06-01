import { detectCompositor, isWlrBased } from "../compositor.ts";
import { createSwayDisplay, removeSwayDisplay, listSwayOutputs } from "./sway.ts";
import { createHyprlandDisplay, removeHyprlandDisplay, listHyprlandOutputs } from "./hyprland.ts";
import { createGnomeDisplay, removeGnomeDisplay, listGnomeOutputs } from "./gnome.ts";
import type { Compositor, VirtualDisplay } from "../../types/index.ts";

export async function createDisplay(
	resolution: string,
	refresh: number,
	compositor?: Compositor,
): Promise<VirtualDisplay> {
	const detected = compositor ?? (await detectCompositor());

	if (detected === "hyprland") return createHyprlandDisplay(resolution, refresh);
	if (detected === "gnome" || detected === "kde") return createGnomeDisplay(resolution, refresh);
	if (isWlrBased(detected)) return createSwayDisplay(resolution, refresh);

	throw new Error(
		`Unsupported or unknown compositor: "${detected}".\n` +
			`Run with --compositor <type> to specify: sway, hyprland, wayfire, river, labwc, niri`,
	);
}

export async function removeDisplay(id: string, compositor?: Compositor): Promise<void> {
	const detected = compositor ?? (await detectCompositor());

	if (detected === "hyprland") return removeHyprlandDisplay(id);
	if (detected === "gnome" || detected === "kde") return removeGnomeDisplay(id);
	if (isWlrBased(detected)) return removeSwayDisplay(id);

	throw new Error(`Cannot remove display: unsupported compositor "${detected}"`);
}

export async function listDisplays(compositor?: Compositor): Promise<VirtualDisplay[]> {
	const detected = compositor ?? (await detectCompositor());

	if (detected === "hyprland") return listHyprlandOutputs();
	if (detected === "gnome" || detected === "kde") return listGnomeOutputs();
	if (isWlrBased(detected)) return listSwayOutputs();

	return [];
}