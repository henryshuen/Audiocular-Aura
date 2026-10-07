import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["tests/freedsp/**/*.test.ts"],
		environment: "node",
		maxWorkers: 1,
		fileParallelism: false,
	},
});
