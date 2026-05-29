import type { VirtualDisplay } from "../../types/index.ts";

// Mutter (GNOME) does not support creating headless outputs via CLI.
// This module throws an informative error on create and is a no-op on remove.

export async function createGnomeDisplay(
	_resolution: string,
	_refresh: number,
): Promise<VirtualDisplay> {
	throw new Error(
		"GNOME/Mutter does not support headless virtual displays via CLI.\n" +
			"Options:\n" +
			"  - Use a nested wlroots compositor: cage, weston, or sway --config /dev/null\n" +
			"  - Switch to a wlroots-based compositor (Hyprland, Sway, etc.)",
	);
}

export async function removeGnomeDisplay(_id: string): Promise<void> {
	// No-op
}

export async function listGnomeOutputs(): Promise<VirtualDisplay[]> {
	return [];
}
