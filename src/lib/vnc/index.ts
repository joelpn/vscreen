import { assertDeps } from "../deps.ts";
import type { VncServer } from "../../types/index.ts";
import {
	findExternalWayvnc,
	isWayvncRunning,
	startWayvnc,
	stopWayvnc,
} from "./wayvnc.ts";

const DEFAULT_VNC_PORT = 5900;

/**
 * Start a VNC server on the given virtual display.
 *
 * Ensures `wayvnc` is installed before attempting to launch.
 * Guards against external instances that could cause port conflicts.
 */
export async function startVnc(
	displayId: string,
	port = DEFAULT_VNC_PORT,
): Promise<VncServer> {
	await assertDeps(["wayvnc"]);

	const externalPid = await findExternalWayvnc();
	if (externalPid) {
		throw new Error(
			`An external wayvnc process is already running (PID ${externalPid}).\n` +
				"Stop it first or choose a different port.",
		);
	}

	return startWayvnc(displayId, port);
}

/**
 * Stop the managed VNC server.
 */
export async function stopVnc(): Promise<void> {
	await stopWayvnc();
}

/**
 * Get the current status of the VNC server.
 *
 * Returns a `VncServer` snapshot when a managed or external instance
 * is running, or `null` when idle.
 */
export async function getVncStatus(
	displayId?: string,
	port = DEFAULT_VNC_PORT,
): Promise<VncServer | null> {
	if (isWayvncRunning()) {
		return {
			displayId: displayId ?? "unknown",
			port,
			running: true,
			startedAt: new Date().toISOString(),
		};
	}

	const externalPid = await findExternalWayvnc();
	if (externalPid) {
		return {
			displayId: displayId ?? "unknown",
			port,
			pid: externalPid,
			running: true,
		};
	}

	return null;
}
