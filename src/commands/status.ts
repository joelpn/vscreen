import { logger } from "../core/logger.ts";
import { getDevices, getTunnels } from "../lib/adb/index.ts";
import { listDisplays } from "../lib/display/index.ts";
import { getVncStatus } from "../lib/vnc/index.ts";

export async function status(): Promise<void> {
	logger.info("--- vscreen status ---\n");

	try {
		const devices = await getDevices();
		logger.success("Android Devices:");
		if (devices.length === 0) {
			logger.dim("  No devices connected");
		} else {
			for (const dev of devices) {
				logger.info(`  • ${dev.serial} [${dev.state}] ${dev.model ? `(${dev.model})` : ""}`);
				if (dev.state === "device") {
					const tunnels = await getTunnels(dev.serial);
					for (const t of tunnels) {
						logger.dim(`    ↳ Tunnel: device:${t.remotePort} -> host:${t.localPort}`);
					}
				}
			}
		}
		console.log("");

		logger.success("VNC Server:");
		const vnc = await getVncStatus();
		if (vnc) {
			logger.info(`  • Running on port ${vnc.port} (Display: ${vnc.displayId})`);
			if (vnc.pid) {
				logger.dim(`    ↳ External process PID: ${vnc.pid}`);
			}
		} else {
			logger.dim("  Not running");
		}
		console.log("");

		logger.success("Virtual Displays:");
		const displays = await listDisplays();
		const virtuals = displays.filter((d) => d.id.includes("HEADLESS") || d.id.includes("Virtual"));

		if (virtuals.length === 0) {
			logger.dim("  No virtual displays active");
		} else {
			for (const d of virtuals) {
				logger.info(`  • ${d.id} (${d.resolution}@${d.refresh}Hz) [${d.compositor}]`);
			}
		}
	} catch (err) {
		logger.error("Failed to fetch status:");
		logger.error(err instanceof Error ? err.message : String(err));
		process.exit(1);
	}
}
