import { assertDeps } from "../deps.ts";
import type { AdbDevice, AdbTunnel } from "../../types/index.ts";
import {
	createReverseTunnel,
	listDevices,
	listReverseTunnels,
	removeAllReverseTunnels,
	removeReverseTunnel,
	waitForDevice,
} from "./adb.ts";

const DEFAULT_VNC_PORT = 5900;

/**
 * Get a list of connected Android devices.
 *
 * Ensures `adb` is installed before querying.
 */
export async function getDevices(): Promise<AdbDevice[]> {
	await assertDeps(["adb"]);
	return listDevices();
}

/**
 * Pick the first authorized device, or a specific one by serial.
 *
 * Validates that the device exists and is in `device` state.
 * Throws a descriptive error when no device is found or the
 * target device is unauthorized/offline.
 */
export async function resolveDevice(serial?: string): Promise<AdbDevice> {
	await assertDeps(["adb"]);
	const devices = await listDevices();

	if (devices.length === 0) {
		throw new Error(
			"No Android devices found.\n" +
				"Connect a device via USB and enable USB debugging in Developer Options.",
		);
	}

	if (serial) {
		const target = devices.find((d) => d.serial === serial);
		if (!target) {
			const available = devices.map((d) => d.serial).join(", ");
			throw new Error(
				`Device "${serial}" not found.\nAvailable devices: ${available}`,
			);
		}
		if (target.state !== "device") {
			throw new Error(
				`Device "${serial}" is ${target.state}.\n` +
					"Accept the USB debugging prompt on the device and try again.",
			);
		}
		return target;
	}

	// No serial specified — pick first authorized device
	const ready = devices.find((d) => d.state === "device");
	if (!ready) {
		const states = devices.map((d) => `${d.serial} (${d.state})`).join(", ");
		throw new Error(
			`No authorized device found.\nDevices: ${states}\n` +
				"Accept the USB debugging prompt on the device and try again.",
		);
	}

	return ready;
}

/**
 * Set up a reverse tunnel from the Android device to the host's VNC port.
 *
 * The Android VNC viewer connects to `localhost:<remotePort>`, which
 * is forwarded to the host's `localhost:<localPort>` where wayvnc listens.
 */
export async function setupTunnel(
	deviceSerial: string,
	localPort = DEFAULT_VNC_PORT,
	remotePort = DEFAULT_VNC_PORT,
): Promise<AdbTunnel> {
	await assertDeps(["adb"]);
	await waitForDevice(deviceSerial);
	return createReverseTunnel(deviceSerial, localPort, remotePort);
}

/**
 * Tear down a specific reverse tunnel on a device.
 */
export async function teardownTunnel(
	deviceSerial: string,
	remotePort = DEFAULT_VNC_PORT,
): Promise<void> {
	await removeReverseTunnel(deviceSerial, remotePort);
}

/**
 * Tear down all reverse tunnels on a device.
 */
export async function teardownAllTunnels(deviceSerial: string): Promise<void> {
	await removeAllReverseTunnels(deviceSerial);
}

/**
 * List active reverse tunnels on a device.
 */
export async function getTunnels(deviceSerial: string): Promise<AdbTunnel[]> {
	return listReverseTunnels(deviceSerial);
}
