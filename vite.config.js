import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import Sitemap from "vite-plugin-sitemap";
import webfontDownload from "vite-plugin-webfont-dl";
import { compression } from "vite-plugin-compression2";
import eslint from "vite-plugin-eslint";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

export default defineConfig(() => ({
	plugins: [
		tailwindcss(),
		solidPlugin(),
		Sitemap({
			hostname: "https://rhm176.de",
			exclude: ["/404"],
			dynamicRoutes: ["/legal/privacy-policy", "/legal/disclaimer"],
			generateRobotsTxt: true,
		}),
		webfontDownload(),
		compression({
			threshold: 2048,
			algorithms: ["brotliCompress"],
			deleteOriginalAssets: false,
			include: /.*$/i,
		}),
		{
			...eslint(),
			apply: "build",
		},
		{
			...eslint({
				failOnWarning: false,
				failOnError: false,
			}),
			apply: "serve",
			enforce: "post",
		},
		ViteImageOptimizer({}),
	],
	server: {
		port: 3000,
	},
	build: {
		target: "esnext",
		cssMinify: "lightningcss",
	},
}));
