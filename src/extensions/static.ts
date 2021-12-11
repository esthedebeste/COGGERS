import { PathLike, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Blueprint, Middleware } from "../utils";

const serveFile =
	(file: PathLike): Middleware =>
	(_req, res) =>
		res.sendFile(file);

export const serveStatic = (
	dir: string | URL,
	options: {
		/**
		 * Allows files to be served in a directory-like path. (/foo => /foo/index.html)
		 * @example ["index.html", "index.htm"]
		 */
		index?: string[];
	} = {}
): Blueprint => {
	if (!options.index) options.index = ["index.html", "index.htm"];
	if (typeof dir === "string") dir = pathToFileURL(dir);
	// make sure the href points to a directory
	dir.href += "/";
	const files = readdirSync(dir, { withFileTypes: true });
	const blueprint: Blueprint = {};
	for (const file of files)
		if (file.isDirectory()) {
			blueprint[file.name] = serveStatic(new URL(file.name, dir), options);
		} else if (file.isFile()) {
			if (options.index.includes(file.name))
				blueprint.$get = serveFile(new URL(file.name, dir));
			blueprint[file.name] = {
				$get: serveFile(new URL(file.name, dir)),
			};
		}
	return blueprint;
};
