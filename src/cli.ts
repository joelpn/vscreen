import { Command } from "commander";
import { displayCommand } from "./commands/display.ts";
import { start } from "./commands/start.ts";
import { status } from "./commands/status.ts";
import { stop } from "./commands/stop.ts";
import { logger } from "./core/logger.ts";
import { spawn } from "node:child_process";
import { openSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

export const program = new Command();

program
	.name("vscreen")
	.description("Turn your Android tablet into a secondary monitor for Linux/Wayland over USB")
	.version(process.env.npm_package_version || "0.1.0");

program
	.command("start")
	.description("Start the vscreen session (creates display, starts VNC, and sets up USB tunnel)")
	.option("-r, --resolution <res>", "Display resolution (e.g. 1920x1080)")
	.option("--refresh <hz>", "Refresh rate in Hz (e.g. 60)", (val) => Number.parseInt(val, 10))
	.option("-p, --vnc-port <port>", "VNC port to use", (val) => Number.parseInt(val, 10))
	.option("-s, --device-serial <serial>", "Specific Android device serial to use")
	.option("-c, --compositor <type>", "Force compositor type (sway, hyprland, wayfire, etc)")
	.option("-n, --name <name>", "Name of the virtual display (e.g. HEADLESS-2)")
	.option("-d, --daemon", "Run the session in the background")
	.action(async (options) => {
		try {
			if (options.daemon) {
				const logDir = join(process.env.HOME ?? "/tmp", ".config/vscreen");
				if (!existsSync(logDir)) {
					mkdirSync(logDir, { recursive: true });
				}
				const logFile = join(logDir, "vscreen.log");
				const fd = openSync(logFile, "a");

				const args = process.argv.slice(2).filter((arg) => arg !== "-d" && arg !== "--daemon");

				const child = spawn(process.argv[0], [process.argv[1], ...args], {
					detached: true,
					stdio: ["ignore", fd, fd],
				});
				child.unref();

				logger.success("✨ vscreen is starting in the background!");
				logger.info(`Logs are available at: ${logFile}`);
				logger.dim("Run 'vscreen stop' to close the session at any time.");
				process.exit(0);
			}

			await start(options);
		} catch (err) {
			logger.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	});

program
	.command("stop")
	.description("Clean up any active vscreen resources")
	.action(async () => {
		await stop();
	});

program
	.command("status")
	.description("Show the current status of devices, tunnels, VNC, and displays")
	.action(async () => {
		await status();
	});

program.addCommand(displayCommand);
