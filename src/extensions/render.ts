import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Middleware } from "../utils";

type RenderFunction =
	| ((
			path: string,
			data: Record<string, unknown>,
			options: Record<string, unknown>,
			cb: (err?: Error, result?: string) => void
	  ) => void)
	| ((
			path: string,
			data: Record<string, unknown>,
			options: Record<string, unknown>
	  ) => Promise<string> | string);

export type ResRender = (
	file: string,
	data?: Record<string, unknown>,
	options?: Record<string, unknown>
) => void;

const resolver = (dir: string, ext?: string) => {
	const cache = new Map<string, string>();
	return (file: string): string => {
		if (cache.has(file)) return cache.get(file);
		const options = [join(dir, file)];
		if (ext) options.push(join(dir, file + ext));
		for (const option of options)
			if (existsSync(option)) {
				cache.set(file, option);
				return option;
			}
		throw new Error(`res.render: ${options.join(", or ")} not found.`);
	};
};

/**
 * @param renderFunction Function used for rendering. Often called renderFile
 * @param directory Directory containing the views, or a file:// URL.
 * - `new URL("VIEW_DIR", import.meta.url)` for ESM
 * - `path.join(__dirname, "VIEW_DIR")` for CJS
 * @param ext Optional but recommended, will allow you to do `render("index")` instead of `render("index.ext")`
 */
export function renderEngine(
	renderFunction: RenderFunction,
	directory: string | URL,
	ext?: string
): Middleware {
	if (ext && ext[0] !== ".") ext = "." + ext;
	const dir = resolve(
		directory instanceof URL ? fileURLToPath(directory) : directory
	);
	const resolveFile = resolver(dir, ext);
	return (_req, res) => {
		res.render = async (file, data = {}, options = {}) => {
			const resolved = resolveFile(file);
			const result = await renderFunction(
				resolved,
				data,
				options,
				(err?: Error, result?: string) => {
					if (err) throw err;
					res.send(result);
				}
			);
			if (typeof result === "string") res.send(result);
		};
	};
}
