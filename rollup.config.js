import ts from "@rollup/plugin-typescript";
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
      name: "exit",
      writeBundle: () => setTimeout(() => process.exit(0), 50),
    },
  ],
  external: Object.keys(dependencies || {}),
};
