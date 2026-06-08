import { Command } from "commander";
import { loadConfig } from "../core/config.ts";
import { logger } from "../core/logger.ts";
import { createDisplay, listDisplays, removeDisplay } from "../lib/display/index.ts";

export const displayCommand = new Command("display").description(
	"Manage virtual displays directly",
);

displayCommand
	.command("create")
	.description("Create a new headless virtual display")
	.option("-r, --resolution <res>", "Display resolution (e.g. 1920x1080)")
	.option("--refresh <hz>", "Refresh rate in Hz (e.g. 60)", (val) => Number.parseInt(val, 10))
	.option("-n, --name <name>", "Name of the virtual display (e.g. HEADLESS-1)")
	.option("-c, --compositor <type>", "Force compositor type")
	.action(async (options) => {
		try {
			const config = await loadConfig();
			const res = options.resolution || config.defaultResolution;
			const ref = options.refresh || config.defaultRefresh;

			logger.info(`Creating virtual display (${res}@${ref}Hz)...`);
			const display = await createDisplay(res, ref, options.name, options.compositor);
			logger.success(`Display created successfully:`);
			console.log(`  ID:         ${display.id}`);
			console.log(`  Resolution: ${display.resolution}`);
			console.log(`  Refresh:    ${display.refresh} Hz`);
			console.log(`  Compositor: ${display.compositor}`);
		} catch (err) {
			logger.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	});

displayCommand
	.command("remove")
	.description("Remove a headless virtual display by ID")
	.argument("<id>", "ID of the display to remove (e.g. HEADLESS-1)")
	.option("-c, --compositor <type>", "Force compositor type")
	.action(async (id, options) => {
		try {
			logger.info(`Removing display ${id}...`);
			await removeDisplay(id, options.compositor);
			logger.success(`Display ${id} removed.`);
		} catch (err) {
			logger.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	});

displayCommand
	.command("list")
	.description("List all active virtual displays")
	.option("-c, --compositor <type>", "Force compositor type")
	.action(async (options) => {
		try {
			const displays = await listDisplays(options.compositor);
			if (displays.length === 0) {
				logger.info("No virtual displays found.");
				return;
			}

			logger.info(`Found ${displays.length} virtual display(s):`);
			for (const display of displays) {
				console.log(
					`- ${display.id}: ${display.resolution} @ ${display.refresh}Hz (${display.compositor})`,
				);
			}
		} catch (err) {
			logger.error(err instanceof Error ? err.message : String(err));
			process.exit(1);
		}
	});
