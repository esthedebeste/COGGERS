import ts from "@rollup/plugin-typescript";
import { rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { dependencies } from "./package.json";

const __dirname = dirname(fileURLToPath(import.meta.url));
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
				rmSync(join(__dirname, "dist"), { recursive: true });
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
