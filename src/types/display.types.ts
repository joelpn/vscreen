export type Compositor =
	| "sway"
	| "hyprland"
	| "wayfire"
	| "river"
	| "labwc"
	| "niri"
	| "gnome"
	| "kde"
	| "unknown";

export type CompositorFamily = "wlroots" | "mutter" | "kwin" | "unknown";

export interface VirtualDisplay {
	id: string;
	resolution: string;
	refresh: number;
	compositor: Compositor;
	createdAt: string;
}
