import { Component, lazy } from "solid-js";

interface RouteConfig {
	path: string;
	component: Component;
	title: string;
	hidden?: boolean;
}

const Error404 = lazy(() => import("./components/Error404"));
const PrivacyPolicy = lazy(() => import("./components/PrivacyPolicy"));
const Disclaimer = lazy(() => import("./components/Disclaimer"));
const Terminal = lazy(() => import("./components/Terminal"));

export const routes: RouteConfig[] = [
	{
		path: "/",
		component: Terminal,
		title: "Home",
	},
	{
		path: "/legal/privacy-policy",
		component: PrivacyPolicy,
		title: "Privacy Policy",
	},
	{
		path: "/legal/disclaimer",
		component: Disclaimer,
		title: "Disclaimer",
	},
	{
		path: "/*",
		component: Error404,
		title: "404",
		hidden: true,
	},
];
