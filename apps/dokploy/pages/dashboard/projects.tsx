import { validateRequest } from "@dokploy/server/lib/auth";
import { Render } from "@measured/puck";
import "@measured/puck/puck.css";
import { createServerSideHelpers } from "@trpc/react-query/server";
import type { GetServerSidePropsContext } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { ReactElement } from "react";
import { useState, useEffect } from "react";
import superjson from "superjson";
import { ShowProjects } from "@/components/dashboard/projects/show";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { puckConfig, type PuckData } from "@/lib/puck/config";
import { appRouter } from "@/server/api/root";
import { api } from "@/utils/api";

const ShowWelcomeDokploy = dynamic(
	() =>
		import("@/components/dashboard/settings/billing/show-welcome-dokploy").then(
			(mod) => mod.ShowWelcomeDokploy,
		),
	{ ssr: false },
);

const Dashboard = () => {
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const { data: user } = api.user.get.useQuery();
	const [puckData, setPuckData] = useState<PuckData | null>(null);

	useEffect(() => {
		const fetchPuckData = async () => {
			try {
				const response = await fetch("/api/puck/dashboard");
				if (response.ok) {
					const data = await response.json();
					setPuckData(data);
				}
			} catch (err) {
				console.error("Failed to load Puck data:", err);
			}
		};

		fetchPuckData();
	}, []);

	return (
		<>
			{isCloud && <ShowWelcomeDokploy />}

			{user?.role === "owner" && (
				<div className="mb-4">
					<Link
						href="/edit/dashboard"
						className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
					>
						Edit Dashboard
					</Link>
				</div>
			)}

			{puckData && (
				<div className="mb-6">
					<Render config={puckConfig} data={puckData} />
				</div>
			)}

			<ShowProjects />
		</>
	);
};

export default Dashboard;

Dashboard.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};
export async function getServerSideProps(
	ctx: GetServerSidePropsContext<{ serviceId: string }>,
) {
	const { req, res } = ctx;
	const { user, session } = await validateRequest(req);

	const helpers = createServerSideHelpers({
		router: appRouter,
		ctx: {
			req: req as any,
			res: res as any,
			db: null as any,
			session: session as any,
			user: user as any,
		},
		transformer: superjson,
	});

	await helpers.settings.isCloud.prefetch();
	await helpers.user.get.prefetch();
	if (!user) {
		return {
			redirect: {
				permanent: true,
				destination: "/",
			},
		};
	}
	return {
		props: {
			trpcState: helpers.dehydrate(),
		},
	};
}
