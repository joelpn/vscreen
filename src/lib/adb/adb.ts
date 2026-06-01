import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { AdbDevice, AdbTunnel } from "../../types/index.ts";

const execFileAsync = promisify(execFile);

/**
 * Run an adb command, optionally targeting a specific device.
 */
async function adb(args: string[], serial?: string): Promise<string> {
	const fullArgs = serial ? ["-s", serial, ...args] : args;
	const { stdout } = await execFileAsync("adb", fullArgs);
	return stdout;
}

/**
 * List connected Android devices.
 *
 * Parses the output of `adb devices -l` to extract serial, state, and
 * model information for each device.
 */
export async function listDevices(): Promise<AdbDevice[]> {
	const stdout = await adb(["devices", "-l"]);
	const lines = stdout.trim().split("\n").slice(1); // skip header

	const devices: AdbDevice[] = [];

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		// Format: "<serial>  <state>  <key:value pairs...>"
		const [serial, state, ...rest] = trimmed.split(/\s+/);
		if (!serial || !state) continue;

		const modelMatch = rest.join(" ").match(/model:(\S+)/);

		devices.push({
			serial,
			state: state as AdbDevice["state"],
			model: modelMatch?.[1],
		});
	}

	return devices;
}

/**
 * Wait for a device to be in `device` (authorized) state.
 *
 * Runs `adb -s <serial> wait-for-device` with a timeout.
 * Resolves once the device is ready, rejects on timeout.
 */
export async function waitForDevice(serial: string, timeoutMs = 10000): Promise<void> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);

	try {
		await execFileAsync("adb", ["-s", serial, "wait-for-device"], {
			signal: controller.signal,
		});
	} catch (err) {
		if ((err as NodeJS.ErrnoException).code === "ABORT_ERR") {
			throw new Error(
				`Timed out waiting for device "${serial}" after ${timeoutMs}ms.\n` +
					"Make sure the device is connected and USB debugging is enabled.",
			);
		}
		throw err;
	} finally {
		clearTimeout(timer);
	}
}

/**
 * Create a reverse port tunnel so the Android device can reach
 * the VNC server on the host via `localhost:<remotePort>`.
 *
 * Runs: `adb -s <serial> reverse tcp:<remotePort> tcp:<localPort>`
 */
export async function createReverseTunnel(
	serial: string,
	localPort: number,
	remotePort: number,
): Promise<AdbTunnel> {
	await adb(["reverse", `tcp:${remotePort}`, `tcp:${localPort}`], serial);

	return {
		deviceSerial: serial,
		localPort,
		remotePort,
		active: true,
	};
}

/**
 * Remove a specific reverse tunnel on the device.
 *
 * Runs: `adb -s <serial> reverse --remove tcp:<remotePort>`
 */
export async function removeReverseTunnel(
	serial: string,
	remotePort: number,
): Promise<void> {
	try {
		await adb(["reverse", "--remove", `tcp:${remotePort}`], serial);
	} catch {
		// Best-effort; tunnel may already be gone
	}
}

/**
 * Remove all reverse tunnels on the device.
 *
 * Runs: `adb -s <serial> reverse --remove-all`
 */
export async function removeAllReverseTunnels(serial: string): Promise<void> {
	try {
		await adb(["reverse", "--remove-all"], serial);
	} catch {
		// Best-effort
	}
}

/**
 * List active reverse tunnels on a device.
 *
 * Parses: `adb -s <serial> reverse --list`
 * Each line has the format: `(reverse) tcp:<remote> tcp:<local>`
 */
export async function listReverseTunnels(serial: string): Promise<AdbTunnel[]> {
	let stdout: string;
	try {
		stdout = await adb(["reverse", "--list"], serial);
	} catch {
		return [];
	}

	const tunnels: AdbTunnel[] = [];

	for (const line of stdout.trim().split("\n")) {
		const match = line.match(/^\(reverse\)\s+tcp:(\d+)\s+tcp:(\d+)$/);
		if (!match) continue;

		tunnels.push({
			deviceSerial: serial,
			remotePort: Number.parseInt(match[1], 10),
			localPort: Number.parseInt(match[2], 10),
			active: true,
		});
	}

	return tunnels;
}
