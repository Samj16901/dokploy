import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
	ensureDataDir,
	getDataPath,
	readPuckData,
	writePuckData,
	listPuckData,
	deletePuckData,
	type PuckData
} from "../../lib/puck/store";

const TEST_DATA_DIR = "./data/puck-test";

// Override the env variable for testing
process.env.PUCK_DATA_DIR = TEST_DATA_DIR;

describe("Puck Store", () => {
	beforeEach(async () => {
		// Clean up both test directory and default directory before each test
		try {
			await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
			await fs.rm("./data/puck", { recursive: true, force: true });
		} catch (error) {
			// Ignore if directory doesn't exist
		}
	});

	afterEach(async () => {
		// Clean up both directories after each test
		try {
			await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
			await fs.rm("./data/puck", { recursive: true, force: true });
		} catch (error) {
			// Ignore errors
		}
	});

	describe("ensureDataDir", () => {
		it("should create data directory if it doesn't exist", async () => {
			await ensureDataDir();
			const exists = await fs.stat(TEST_DATA_DIR).then(() => true).catch(() => false);
			expect(exists).toBe(true);
		});

		it("should not throw if directory already exists", async () => {
			await ensureDataDir();
			await expect(ensureDataDir()).resolves.not.toThrow();
		});
	});

	describe("getDataPath", () => {
		it("should return correct path for valid id", () => {
			const result = getDataPath("dashboard");
			expect(result).toBe(path.join(TEST_DATA_DIR, "dashboard.json"));
		});

		it("should sanitize invalid characters in id", () => {
			const result = getDataPath("../../etc/passwd");
			expect(result).toBe(path.join(TEST_DATA_DIR, "______etc_passwd.json"));
		});

		it("should sanitize special characters", () => {
			const result = getDataPath("test@#$%");
			expect(result).toBe(path.join(TEST_DATA_DIR, "test____.json"));
		});
	});

	describe("writePuckData", () => {
		it("should write data to file", async () => {
			const testData: PuckData = {
				content: [{ type: "StatCard", props: { title: "Test" } }],
				root: {}
			};

			await writePuckData("test", testData);

			const filePath = getDataPath("test");
			const fileContent = await fs.readFile(filePath, "utf-8");
			const parsed = JSON.parse(fileContent);

			expect(parsed).toEqual(testData);
		});

		it("should create directory if it doesn't exist", async () => {
			const testData: PuckData = {
				content: [],
				root: {}
			};

			await writePuckData("test", testData);
			const filePath = getDataPath("test");
			const exists = await fs.stat(filePath).then(() => true).catch(() => false);

			expect(exists).toBe(true);
		});

		it("should format JSON with indentation", async () => {
			const testData: PuckData = {
				content: [],
				root: {}
			};

			await writePuckData("test", testData);
			const filePath = getDataPath("test");
			const fileContent = await fs.readFile(filePath, "utf-8");

			expect(fileContent).toContain("\n");
			expect(fileContent).toContain("  ");
		});
	});

	describe("readPuckData", () => {
		it("should read data from file", async () => {
			const testData: PuckData = {
				content: [{ type: "StatCard", props: { title: "Test" } }],
				root: {}
			};

			await writePuckData("test", testData);
			const result = await readPuckData("test");

			expect(result).toEqual(testData);
		});

		it("should return null for non-existent file", async () => {
			const result = await readPuckData("non-existent");
			expect(result).toBeNull();
		});

		it("should throw for invalid JSON", async () => {
			await ensureDataDir();
			const filePath = getDataPath("invalid");
			await fs.writeFile(filePath, "invalid json", "utf-8");

			await expect(readPuckData("invalid")).rejects.toThrow();
		});
	});

	describe("listPuckData", () => {
		it("should return empty array when no files exist", async () => {
			const result = await listPuckData();
			expect(result).toEqual([]);
		});

		it("should list all json files", async () => {
			const testData: PuckData = { content: [], root: {} };

			await writePuckData("test1", testData);
			await writePuckData("test2", testData);
			await writePuckData("test3", testData);

			const result = await listPuckData();

			expect(result).toHaveLength(3);
			expect(result).toContain("test1");
			expect(result).toContain("test2");
			expect(result).toContain("test3");
		});

		it("should ignore non-json files", async () => {
			await ensureDataDir();
			const testData: PuckData = { content: [], root: {} };

			await writePuckData("test", testData);
			await fs.writeFile(path.join(TEST_DATA_DIR, "other.txt"), "test", "utf-8");

			const result = await listPuckData();

			expect(result).toHaveLength(1);
			expect(result).toContain("test");
		});
	});

	describe("deletePuckData", () => {
		it("should delete file", async () => {
			const testData: PuckData = { content: [], root: {} };
			await writePuckData("test", testData);

			await deletePuckData("test");

			const result = await readPuckData("test");
			expect(result).toBeNull();
		});

		it("should throw for non-existent file", async () => {
			await expect(deletePuckData("non-existent")).rejects.toThrow();
		});
	});
});
