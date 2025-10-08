import type { Config } from "@measured/puck";
import React from "react";

export type PuckData = {
	content: any[];
	root: Record<string, any>;
};

// StatCard component
const StatCard = ({ title, value, description }: { title: string; value: string; description?: string }) => {
	return React.createElement("div", {
		className: "rounded-lg border bg-card text-card-foreground shadow-sm p-6"
	}, [
		React.createElement("div", { className: "flex flex-col space-y-1.5", key: "header" }, [
			React.createElement("h3", { className: "text-2xl font-semibold leading-none tracking-tight", key: "title" }, title),
			description && React.createElement("p", { className: "text-sm text-muted-foreground", key: "desc" }, description)
		]),
		React.createElement("div", { className: "text-3xl font-bold mt-4", key: "value" }, value)
	]);
};

// Grid component
const Grid = ({ children, columns = 3 }: { children: React.ReactNode; columns?: number }) => {
	return React.createElement("div", {
		className: `grid gap-4 md:grid-cols-${columns}`,
		style: { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
	}, children);
};

// Markdown component
const Markdown = ({ content }: { content: string }) => {
	return React.createElement("div", {
		className: "prose prose-sm max-w-none",
		dangerouslySetInnerHTML: { __html: content || "" }
	});
};

// ChartStub component
const ChartStub = ({ title, type = "line" }: { title: string; type?: "line" | "bar" | "pie" }) => {
	return React.createElement("div", {
		className: "rounded-lg border bg-card text-card-foreground shadow-sm p-6"
	}, [
		React.createElement("h3", { className: "text-lg font-semibold mb-4", key: "title" }, title),
		React.createElement("div", {
			className: "h-64 flex items-center justify-center bg-muted rounded",
			key: "chart"
		}, React.createElement("p", { className: "text-muted-foreground" }, `${type.charAt(0).toUpperCase() + type.slice(1)} Chart Placeholder`))
	]);
};

export const puckConfig: Config = {
	components: {
		StatCard: {
			fields: {
				title: { type: "text", label: "Title" },
				value: { type: "text", label: "Value" },
				description: { type: "text", label: "Description" }
			},
			defaultProps: {
				title: "Stat Title",
				value: "0",
				description: "Stat description"
			},
			render: StatCard
		},
		Grid: {
			fields: {
				columns: { type: "number", label: "Columns", min: 1, max: 6 }
			},
			defaultProps: {
				columns: 3
			},
			render: Grid
		},
		Markdown: {
			fields: {
				content: { type: "textarea", label: "Markdown Content" }
			},
			defaultProps: {
				content: "# Heading\n\nMarkdown content here..."
			},
			render: Markdown
		},
		ChartStub: {
			fields: {
				title: { type: "text", label: "Chart Title" },
				type: {
					type: "select",
					label: "Chart Type",
					options: [
						{ label: "Line", value: "line" },
						{ label: "Bar", value: "bar" },
						{ label: "Pie", value: "pie" }
					]
				}
			},
			defaultProps: {
				title: "Chart Title",
				type: "line"
			},
			render: ChartStub
		}
	}
};
