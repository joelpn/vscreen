export type { AdbDevice, AdbTunnel } from "./adb.types.js";
export type { VscreenConfig } from "./config.types.js";
export type { Compositor, CompositorFamily, VirtualDisplay } from "./display.types.js";
export type { VncServer } from "./vnc.types.js";

export interface VScreenState {
	display: import("./display.types.js").VirtualDisplay | null;
	vnc: import("./vnc.types.js").VncServer | null;
	adb: import("./adb.types.js").AdbTunnel | null;
	isRunning: boolean;
}

export interface DepStatus {
	name: string;
	available: boolean;
	version?: string;
}

export interface DepCheckResult {
	required: DepStatus[];
	optional: DepStatus[];
	ok: boolean;
	missing: string[];
}

export interface StartOptions {
	resolution?: string;
	refresh?: number;
	vncPort?: number;
	deviceSerial?: string;
	compositor?: import("./display.types.js").Compositor;
}
