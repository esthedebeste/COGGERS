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
		/**
		 * Allows files to be served without their extensions. (/foo => /foo.html)
		 * @example [".html", ".htm"]
		 */
		ext?: string[];
	} = {}
): Blueprint => {
	if (!options.index) options.index = ["index.html", "index.htm"];
	if (!options.ext) options.ext = [".html", ".htm"];
	if (typeof dir === "string") dir = pathToFileURL(dir);
	// make sure the href points to a directory
	dir.href += "/";
	const files = readdirSync(dir, { withFileTypes: true });
	const blueprint: Blueprint = {};
	for (const file of files) {
		const server = serveFile(new URL(file.name, dir));
		if (file.isDirectory()) {
			blueprint[file.name] = server;
		} else if (file.isFile()) {
			if (options.index.includes(file.name)) blueprint.$get = server;
			for (const ext of options.ext)
				if (file.name.endsWith(ext))
					blueprint[file.name.slice(0, -ext.length)] = { $get: server };
			blueprint[file.name] = { $get: server };
		}
	}
	return blueprint;
};
