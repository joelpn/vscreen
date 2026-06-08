import ora from "ora";
import { loadConfig } from "../core/config.ts";
import { logger } from "../core/logger.ts";
import { state } from "../core/state.ts";
import { resolveDevice, setupTunnel, teardownAllTunnels } from "../lib/adb/index.ts";
import { checkDeps } from "../lib/deps.ts";
import { createDisplay, removeDisplay } from "../lib/display/index.ts";
import { getVncStatus, startVnc, stopVnc } from "../lib/vnc/index.ts";
import type { StartOptions } from "../types/index.ts";

export async function start(options: StartOptions): Promise<void> {
	if (state.get("isRunning")) {
		logger.error("vscreen is already running.");
		process.exit(1);
	}

	// Guard: check if a VNC server is already running from a previous/background session.
	// This prevents creating orphaned headless displays when the session can't start anyway.
	const existingVnc = await getVncStatus();
	if (existingVnc?.running) {
		logger.error(
			`A vscreen session appears to be already active (wayvnc PID ${existingVnc.pid ?? "managed"} is running).\n` +
				"Run 'vscreen stop' first before starting a new session.",
		);
		process.exit(1);
	}

	const now = new Date().toLocaleString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
	console.log();
	console.log("━".repeat(52));
	console.log(`▶  New session — ${now}`);
	console.log("━".repeat(52));
	console.log();

	const config = await loadConfig();
	const resolution = options.resolution ?? config.defaultResolution;
	const refresh = options.refresh ?? config.defaultRefresh;
	const vncPort = options.vncPort ?? config.defaultVncPort;

	logger.info("Starting vscreen session...");
	const spinner = ora("Checking dependencies...").start();

	try {
		const deps = await checkDeps();
		if (!deps.ok) {
			spinner.fail("Missing required dependencies");
			logger.error(`Please install: ${deps.missing.join(", ")}`);
			process.exit(1);
		}

		spinner.text = "Resolving Android device...";
		const device = await resolveDevice(options.deviceSerial);
		spinner.succeed(`Device resolved: ${device.serial} (${device.model ?? "unknown"})`);

		// Clean up any stale tunnels
		await teardownAllTunnels(device.serial);

		spinner.start(`Creating virtual display (${resolution}@${refresh}Hz)...`);
		const display = await createDisplay(resolution, refresh, options.name, options.compositor);
		state.setDisplay(display);
		spinner.succeed(`Virtual display created: ${display.id} (${display.compositor})`);

		spinner.start(`Starting VNC server on port ${vncPort}...`);
		const vnc = await startVnc(display.id, vncPort);
		state.setVnc(vnc);
		spinner.succeed(`VNC server running on port ${vncPort}`);

		spinner.start("Setting up USB tunnel...");
		const tunnel = await setupTunnel(device.serial, vncPort, vncPort);
		state.setAdb(tunnel);
		spinner.succeed("USB tunnel established");

		state.setRunning(true);

		logger.success("\n✨ vscreen is active!");
		logger.dim("Press Ctrl+C to stop the session");

		// Handle graceful shutdown
		let shuttingDown = false;
		const cleanup = async () => {
			if (shuttingDown) return;
			shuttingDown = true;

			logger.info("\nShutting down...");
			spinner.start("Tearing down USB tunnel...");
			await teardownAllTunnels(device.serial).catch(() => {});
			spinner.succeed("Tunnel removed");

			spinner.start("Stopping VNC server...");
			await stopVnc().catch(() => {});
			spinner.succeed("VNC server stopped");

			spinner.start("Removing virtual display...");
			await removeDisplay(display.id).catch(() => {});
			spinner.succeed("Virtual display removed");

			state.reset();
			logger.success("Cleanup complete.");
			process.exit(0);
		};

		process.on("SIGINT", cleanup);
		process.on("SIGTERM", cleanup);

		// Keep process alive
		await new Promise(() => {});
	} catch (err) {
		spinner.fail("Failed to start session");
		logger.error(err instanceof Error ? err.message : String(err));

		// Attempt cleanup of whatever we managed to create
		await stopVnc().catch(() => {});
		if (state.get("display")) {
			await removeDisplay(state.get("display")!.id).catch(() => {});
		}
		if (state.get("adb")) {
			await teardownAllTunnels(state.get("adb")!.deviceSerial).catch(() => {});
		}

		process.exit(1);
	}
}
