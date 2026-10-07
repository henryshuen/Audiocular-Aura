import { defineConfig } from "vite";

export default defineConfig({
	// Using relative paths makes the bundle portable to any subdirectory on GitHub Pages
	base: "./",
	server: { host: "localhost", port: 5173, strictPort: true },
	build: {
		outDir: "dist",
		rollupOptions: {
			output: {
				entryFileNames: "assets/[name].js",
				chunkFileNames: "assets/[name].js",
				assetFileNames: "assets/[name].[ext]",
			},
		},
	},
});
