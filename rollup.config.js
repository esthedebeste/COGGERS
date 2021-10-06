import ts from "@rollup/plugin-typescript";
import { rmSync } from "fs";
import { fileURLToPath } from "url";
import { dependencies } from "./package.json";

/** @type {import("rollup").RollupOptions} */
export default {
	input: "src/coggers.ts",
	output: {
		preserveModules: true,
		dir: "dist",
	},
	plugins: [
		ts({ include: ["./src/**/*.ts"] }),
		{
			buildStart() {
				rmSync(fileURLToPath(new URL("dist", import.meta.url)), {
					recursive: true,
				});
			},
			writeBundle() {
				setTimeout(process.exit);
			},
			resolveId(id) {
				// Remove warning about node:http
				if (id.startsWith("node:")) {
					return { id, external: true };
				}
				return null;
			},
		},
	],
	external: Object.keys(dependencies || {}),
};
