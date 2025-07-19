import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import Sitemap from "vite-plugin-sitemap";
import webfontDownload from "vite-plugin-webfont-dl";
import { compression } from "vite-plugin-compression2";
import solidSvg from "vite-plugin-solid-svg";

export default defineConfig((configEnv) => ({
	plugins: [
		tailwindcss(),
		solidPlugin(),
		Sitemap({
			hostname: "https://rhm176.de",
			exclude: ["/404"],
			dynamicRoutes: ["/legal/privacy-policy", "/legal/disclaimer"],
		}),
		webfontDownload(),
		compression({
			threshold: 2048,
			algorithm: "brotliCompress",
			deleteOriginalAssets: false,
			include: /assets\/.*$/i,
		}),
		solidSvg(),
	],
	server: {
		port: 3000,
	},
	build: {
		target: "esnext",
		cssMinify: "lightningcss",
	},
}));
