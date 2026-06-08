export { loadConfig, saveConfig } from "./core/config.ts";
export { logger } from "./core/logger.ts";
export { state } from "./core/state.ts";
export * from "./lib/adb/index.ts";
export * from "./lib/display/index.ts";
export * from "./lib/vnc/index.ts";
export * from "./types/index.ts";

import { program } from "./cli.ts";

/**
 * Entry point for the CLI.
 * Can be called manually if using vscreen programmatically.
 */
export function runCli(argv = process.argv): void {
	program.parse(argv);
}

// If this file is executed directly (e.g., via tsx), run the CLI
if (
	process.argv[1] &&
	(import.meta.url === `file://${process.argv[1]}` ||
		process.argv[1].endsWith("vscreen/src/index.ts"))
) {
	runCli();
}
