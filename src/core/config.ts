import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { VscreenConfig } from "../types/config.types.js";

const CONFIG_DIR = join(process.env.HOME ?? "/tmp", ".config/vscreen");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

const defaults: VscreenConfig = {
	defaultRefresh: 60,
	defaultResolution: "1920x1080",
	defaultVncPort: 5900,
};

export async function loadConfig(): Promise<VscreenConfig> {
	try {
		const raw = await readFile(CONFIG_FILE, "utf8");
		return { ...defaults, ...JSON.parse(raw) };
	} catch {
		return defaults;
	}
}

export async function saveConfig(config: Partial<VscreenConfig>): Promise<void> {
	if (!existsSync(CONFIG_DIR)) {
		await mkdir(CONFIG_DIR, { recursive: true });
	}

	const current = await loadConfig();
	await writeFile(CONFIG_FILE, JSON.stringify({ ...current, ...config }, null, 2));
}
