import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy"; // 1. Bu satırı ekledik
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [
		tailwindcss(),
		tanstackRouter({}),
		react(),
		legacy({ // 2. Bu blok Instagram beyaz ekran hatasını çözer
			targets: ['ios >= 12', 'chrome >= 64', 'not IE 11'],
		})
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: { // 3. Bu ayar kodun dilini eskitir ki herkes anlasın
		target: 'es2015',
		cssTarget: 'chrome61'
	}
});