import ora from "ora";
import { logger } from "../core/logger.ts";
import { getDevices, teardownAllTunnels } from "../lib/adb/index.ts";
import { listDisplays, removeDisplay } from "../lib/display/index.ts";
import { getVncStatus, stopVnc } from "../lib/vnc/index.ts";

export async function stop(): Promise<void> {
	logger.info("Cleaning up vscreen resources...");
	const spinner = ora("Checking active resources...").start();

	try {
		spinner.text = "Checking Android tunnels...";
		try {
			const devices = await getDevices();
			for (const dev of devices) {
				await teardownAllTunnels(dev.serial);
			}
			spinner.succeed("Removed all Android reverse tunnels");
		} catch {
			spinner.warn("Could not check Android devices (adb missing?)");
		}

		spinner.start("Checking VNC server...");
		const vncStatus = await getVncStatus();
		if (vncStatus?.running) {
			await stopVnc();
			spinner.succeed("VNC server stopped");
		} else {
			spinner.info("No managed VNC server running");
		}

		spinner.start("Checking virtual displays...");
		const displays = await listDisplays();
		let removedCount = 0;
		for (const display of displays) {
			if (display.id.startsWith("HEADLESS") || display.id.startsWith("Virtual")) {
				await removeDisplay(display.id, display.compositor);
				removedCount++;
				spinner.succeed(`Removed virtual display ${display.id}`);
			}
		}
		if (removedCount === 0) {
			spinner.info("No virtual displays found");
		}

		logger.success("\n✨ Cleanup complete!");
	} catch (err) {
		spinner.fail("Error during cleanup");
		logger.error(err instanceof Error ? err.message : String(err));
		process.exit(1);
	}
}
