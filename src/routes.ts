import { Component, lazy } from "solid-js";

interface RouteConfig {
	path: string;
	component: Component;
	title: string;
	hidden?: boolean;
}

export const routes: RouteConfig[] = [
	{
		path: "/",
		component: lazy(() => import("./components/Terminal")),
		title: "Home",
	},
	{
		path: "/legal/privacy-policy",
		component: lazy(() => import("./components/PrivacyPolicy")),
		title: "Privacy Policy",
	},
	{
		path: "/legal/disclaimer",
		component: lazy(() => import("./components/Disclaimer")),
		title: "Disclaimer",
	},
	{
		path: "/minecraft",
		component: lazy(() => import("./components/Minecraft")),
		title: "Minecraft",
	},
	{
		path: "/equilinox",
		component: lazy(() => import("./components/Equilinox")),
		title: "Equilinox",
	},
	{
		path: "/portfolio",
		component: lazy(() => import("./components/Portfolio")),
		title: "Portfolio",
	},
	{
		path: "/*",
		component: lazy(() => import("./components/Error404")),
		title: "404",
		hidden: true,
	},
];
