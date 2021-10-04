import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Middleware } from "../types";

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
	data?: Record<string, string>,
	options?: Record<string, string>
) => void;

function resolveFile(
	dir: string,
	file: string,
	ext: string | null,
	cache: Map<string, string | null>
): string {
	/* Maps don't do deep equality */
	const cacheName = JSON.stringify([dir, file, ext]);
	if (cache.has(cacheName)) return cache.get(cacheName);
	let options = [join(dir, file)];
	if (ext) options = [...options, join(dir, file + "." + ext)];
	for (const option of options)
		if (existsSync(option)) {
			cache.set(cacheName, option);
			return option;
		}
	return null;
}

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
	const dir = resolve(
		directory instanceof URL ? fileURLToPath(directory) : directory
	);
	const cache = new Map<string, string | null>();
	return (_req, res) => {
		res.render = (file, data, options) => {
			const resolved = resolveFile(dir, file, ext, cache);
			if (resolved == null)
				throw new Error(
					`renderEngine: ${file} with extension ${ext} not found in directory ${dir}`
				);

			const callback = (result: string) => res.send(result);
			const promise = renderFunction(
				resolved,
				data,
				options,
				(err?: Error, result?: string) => {
					if (err) throw err;
					callback(result);
				}
			);
			if (promise instanceof Promise) promise.then(callback);
			else if (typeof promise === "string") callback(promise);
		};
	};
}
