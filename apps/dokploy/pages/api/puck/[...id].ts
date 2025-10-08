import { validateRequest } from "@dokploy/server";
import type { NextApiRequest, NextApiResponse } from "next";
import { readPuckData, writePuckData } from "@/lib/puck/store";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const { session, user } = await validateRequest(req);

	// Check authentication and admin role
	if (!user || !session) {
		res.status(401).json({ message: "Unauthorized" });
		return;
	}

	if (user.role !== "owner") {
		res.status(403).json({ message: "Forbidden - Admin role required" });
		return;
	}

	const { id } = req.query;
	const puckId = Array.isArray(id) ? id.join("/") : id || "default";

	try {
		if (req.method === "GET") {
			const data = await readPuckData(puckId);
			if (!data) {
				res.status(404).json({ message: "Not found" });
				return;
			}
			res.status(200).json(data);
		} else if (req.method === "POST") {
			const data = req.body;
			await writePuckData(puckId, data);
			res.status(200).json({ message: "Success", data });
		} else {
			res.status(405).json({ message: "Method not allowed" });
		}
	} catch (error) {
		console.error("Puck API error:", error);
		res.status(500).json({ 
			message: "Internal server error",
			error: error instanceof Error ? error.message : "Unknown error"
		});
	}
};

export default handler;
