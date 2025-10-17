import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import Sitemap from "vite-plugin-sitemap";
import webfontDownload from "vite-plugin-webfont-dl";
import { compression } from "vite-plugin-compression2";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import eslintPlugin from "@nabla/vite-plugin-eslint";

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
		ViteImageOptimizer({}),
		compression({
			threshold: 2048,
			algorithms: ["brotliCompress"],
			deleteOriginalAssets: false,
			include: /.*$/i,
		}),
		eslintPlugin(),
	],
	server: {
		port: 3000,
	},
	build: {
		target: "esnext",
		cssMinify: "lightningcss",
	},
}));
