import type { AdbTunnel } from "../types/adb.types.ts";
import type { Compositor, VirtualDisplay } from "../types/display.types.ts";
import type { VncServer } from "../types/vnc.types.ts";


export interface VScreenState {
	display: VirtualDisplay | null;
	vnc: VncServer | null;
	adb: AdbTunnel | null;
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
	compositor?: Compositor;
}
