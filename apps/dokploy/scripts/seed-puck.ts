import { writePuckData } from "../lib/puck/store";
import type { PuckData } from "../lib/puck/config";

const dashboardData: PuckData = {
	content: [
		{
			type: "Grid",
			props: {
				id: "grid-1",
				columns: 3
			}
		},
		{
			type: "StatCard",
			props: {
				id: "stat-1",
				title: "Total Projects",
				value: "12",
				description: "Active projects in the system"
			}
		},
		{
			type: "StatCard",
			props: {
				id: "stat-2",
				title: "Deployments",
				value: "45",
				description: "Successful deployments this month"
			}
		},
		{
			type: "StatCard",
			props: {
				id: "stat-3",
				title: "Active Services",
				value: "28",
				description: "Currently running services"
			}
		},
		{
			type: "ChartStub",
			props: {
				id: "chart-1",
				title: "Deployment Activity",
				type: "line"
			}
		},
		{
			type: "Markdown",
			props: {
				id: "markdown-1",
				content: "# Welcome to Dokploy\n\nThis is a customizable dashboard built with Puck editor.\n\n## Features\n- Visual editing\n- Real-time preview\n- Persistent storage"
			}
		}
	],
	root: {
		props: {}
	}
};

async function seedPuckData() {
	try {
		console.log("Seeding Puck data...");
		await writePuckData("dashboard", dashboardData);
		console.log("✓ Dashboard data seeded successfully");
	} catch (error) {
		console.error("Error seeding Puck data:", error);
		process.exit(1);
	}
}

seedPuckData();
