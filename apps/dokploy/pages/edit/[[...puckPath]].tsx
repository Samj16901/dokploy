import { validateRequest } from "@dokploy/server";
import { Puck } from "@measured/puck";
import "@measured/puck/puck.css";
import type { GetServerSidePropsContext } from "next";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { puckConfig, type PuckData } from "@/lib/puck/config";

const PuckEditor = () => {
	const router = useRouter();
	const { puckPath } = router.query;
	const path = Array.isArray(puckPath) ? puckPath.join("/") : puckPath || "dashboard";
	
	const [data, setData] = useState<PuckData | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const response = await fetch(`/api/puck/${path}`);
				if (response.ok) {
					const result = await response.json();
					setData(result);
				} else if (response.status === 404) {
					// Initialize with empty data
					setData({ content: [], root: {} });
				} else {
					throw new Error(`Failed to load: ${response.statusText}`);
				}
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load data");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [path]);

	const handlePublish = async (newData: PuckData) => {
		try {
			const response = await fetch(`/api/puck/${path}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(newData)
			});

			if (!response.ok) {
				throw new Error("Failed to save");
			}

			// Redirect back to dashboard after successful save
			router.push("/dashboard/projects");
		} catch (err) {
			console.error("Failed to publish:", err);
			alert("Failed to save changes");
		}
	};

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-lg">Loading editor...</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-lg text-red-500">Error: {error}</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="flex h-screen items-center justify-center">
				<div className="text-lg">No data found</div>
			</div>
		);
	}

	return (
		<div className="h-screen">
			<Puck
				config={puckConfig}
				data={data}
				onPublish={handlePublish}
			/>
		</div>
	);
};

export default PuckEditor;

export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{ puckPath?: string[] }>
) {
	const { req } = ctx;
	const { user, session } = await validateRequest(req);

	// Check authentication and admin role
	if (!user || !session) {
		return {
			redirect: {
				permanent: false,
				destination: "/",
			},
		};
	}

	if (user.role !== "owner") {
		return {
			redirect: {
				permanent: false,
				destination: "/dashboard/projects",
			},
		};
	}

	return {
		props: {},
	};
}
