import ts from "@rollup/plugin-typescript";
import { existsSync, rmSync } from "fs";
import { fileURLToPath } from "url";
import { dependencies } from "./package.json";

const distDir = fileURLToPath(new URL("dist", import.meta.url));
/** @type {import("rollup").RollupOptions} */
export default {
	input: "src/coggers.ts",
	output: {
		preserveModules: true,
		dir: distDir,
	},
	plugins: [
		ts({ include: ["./src/**/*.ts"] }),
		{
			buildStart() {
				if (existsSync(distDir)) rmSync(distDir, { recursive: true });
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
	external: Object.keys(dependencies),
};
