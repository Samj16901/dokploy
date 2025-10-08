import { promises as fs } from "node:fs";
import path from "node:path";

function getPuckDataDir(): string {
	return process.env.PUCK_DATA_DIR || "./data/puck";
}

export interface PuckData {
	content: any[];
	root: Record<string, any>;
	[key: string]: any;
}

/**
 * Ensure the data directory exists
 */
export async function ensureDataDir(): Promise<void> {
	const PUCK_DATA_DIR = getPuckDataDir();
	try {
		await fs.mkdir(PUCK_DATA_DIR, { recursive: true });
	} catch (error) {
		// Ignore if directory already exists
		if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
			throw error;
		}
	}
}

/**
 * Get the full path for a puck data file
 */
export function getDataPath(id: string): string {
	const PUCK_DATA_DIR = getPuckDataDir();
	// Sanitize the id to prevent path traversal
	const sanitizedId = id.replace(/[^a-zA-Z0-9_-]/g, "_");
	return path.join(PUCK_DATA_DIR, `${sanitizedId}.json`);
}

/**
 * Read puck data from file
 */
export async function readPuckData(id: string): Promise<PuckData | null> {
	try {
		const filePath = getDataPath(id);
		const fileContent = await fs.readFile(filePath, "utf-8");
		return JSON.parse(fileContent) as PuckData;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return null;
		}
		throw error;
	}
}

/**
 * Write puck data to file
 */
export async function writePuckData(id: string, data: PuckData): Promise<void> {
	await ensureDataDir();
	const filePath = getDataPath(id);
	await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * List all puck data files
 */
export async function listPuckData(): Promise<string[]> {
	const PUCK_DATA_DIR = getPuckDataDir();
	try {
		await ensureDataDir();
		const files = await fs.readdir(PUCK_DATA_DIR);
		return files
			.filter((file) => file.endsWith(".json"))
			.map((file) => file.replace(".json", ""));
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") {
			return [];
		}
		throw error;
	}
}

/**
 * Delete puck data file
 */
export async function deletePuckData(id: string): Promise<void> {
	const filePath = getDataPath(id);
	await fs.unlink(filePath);
}
