import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "../../pages/api/puck/[...id]";
import * as store from "../../lib/puck/store";
import type { PuckData } from "../../lib/puck/config";

// Mock the validateRequest function
vi.mock("@dokploy/server", () => ({
	validateRequest: vi.fn()
}));

// Mock the store functions
vi.mock("../../lib/puck/store", () => ({
	readPuckData: vi.fn(),
	writePuckData: vi.fn()
}));

import { validateRequest } from "@dokploy/server";

describe("Puck API Routes", () => {
	let req: Partial<NextApiRequest>;
	let res: Partial<NextApiResponse>;
	let jsonMock: ReturnType<typeof vi.fn>;
	let statusMock: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		jsonMock = vi.fn();
		statusMock = vi.fn().mockReturnValue({ json: jsonMock }) as any;

		req = {
			method: "GET",
			query: { id: ["dashboard"] }
		};

		res = {
			status: statusMock as any,
			json: jsonMock
		};

		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should return 401 if user is not authenticated", async () => {
			vi.mocked(validateRequest).mockResolvedValue({
				session: null,
				user: null
			});

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(statusMock).toHaveBeenCalledWith(401);
			expect(jsonMock).toHaveBeenCalledWith({ message: "Unauthorized" });
		});

		it("should return 403 if user is not owner", async () => {
			vi.mocked(validateRequest).mockResolvedValue({
				session: { id: "1" } as any,
				user: { id: "1", role: "member" } as any
			});

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(statusMock).toHaveBeenCalledWith(403);
			expect(jsonMock).toHaveBeenCalledWith({ message: "Forbidden - Admin role required" });
		});
	});

	describe("GET method", () => {
		beforeEach(() => {
			vi.mocked(validateRequest).mockResolvedValue({
				session: { id: "1" } as any,
				user: { id: "1", role: "owner" } as any
			});
		});

		it("should return data for existing puck file", async () => {
			const mockData: PuckData = {
				content: [{ type: "StatCard", props: { title: "Test" } }],
				root: {}
			};

			vi.mocked(store.readPuckData).mockResolvedValue(mockData);

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(store.readPuckData).toHaveBeenCalledWith("dashboard");
			expect(statusMock).toHaveBeenCalledWith(200);
			expect(jsonMock).toHaveBeenCalledWith(mockData);
		});

		it("should return 404 for non-existent file", async () => {
			vi.mocked(store.readPuckData).mockResolvedValue(null);

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(statusMock).toHaveBeenCalledWith(404);
			expect(jsonMock).toHaveBeenCalledWith({ message: "Not found" });
		});

		it("should handle nested paths", async () => {
			req.query = { id: ["path", "to", "file"] };
			const mockData: PuckData = { content: [], root: {} };
			vi.mocked(store.readPuckData).mockResolvedValue(mockData);

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(store.readPuckData).toHaveBeenCalledWith("path/to/file");
		});

		it("should handle errors gracefully", async () => {
			vi.mocked(store.readPuckData).mockRejectedValue(new Error("Read error"));

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(statusMock).toHaveBeenCalledWith(500);
			expect(jsonMock).toHaveBeenCalledWith({
				message: "Internal server error",
				error: "Read error"
			});
		});
	});

	describe("POST method", () => {
		beforeEach(() => {
			req.method = "POST";
			vi.mocked(validateRequest).mockResolvedValue({
				session: { id: "1" } as any,
				user: { id: "1", role: "owner" } as any
			});
		});

		it("should save data successfully", async () => {
			const mockData: PuckData = {
				content: [{ type: "StatCard", props: { title: "New" } }],
				root: {}
			};

			req.body = mockData;
			vi.mocked(store.writePuckData).mockResolvedValue(undefined);

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(store.writePuckData).toHaveBeenCalledWith("dashboard", mockData);
			expect(statusMock).toHaveBeenCalledWith(200);
			expect(jsonMock).toHaveBeenCalledWith({ message: "Success", data: mockData });
		});

		it("should handle write errors", async () => {
			req.body = { content: [], root: {} };
			vi.mocked(store.writePuckData).mockRejectedValue(new Error("Write error"));

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(statusMock).toHaveBeenCalledWith(500);
			expect(jsonMock).toHaveBeenCalledWith({
				message: "Internal server error",
				error: "Write error"
			});
		});
	});

	describe("Unsupported methods", () => {
		beforeEach(() => {
			vi.mocked(validateRequest).mockResolvedValue({
				session: { id: "1" } as any,
				user: { id: "1", role: "owner" } as any
			});
		});

		it("should return 405 for PUT method", async () => {
			req.method = "PUT";

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(statusMock).toHaveBeenCalledWith(405);
			expect(jsonMock).toHaveBeenCalledWith({ message: "Method not allowed" });
		});

		it("should return 405 for DELETE method", async () => {
			req.method = "DELETE";

			await handler(req as NextApiRequest, res as NextApiResponse);

			expect(statusMock).toHaveBeenCalledWith(405);
			expect(jsonMock).toHaveBeenCalledWith({ message: "Method not allowed" });
		});
	});
});
