import { PathLike, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Blueprint, Middleware } from "../utils";

const serveFile =
	(file: PathLike): Middleware =>
	(_req, res) =>
		res.sendFile(file);

export const serveStatic = (dir: string | URL): Blueprint => {
	if (typeof dir === "string") dir = pathToFileURL(dir);
	// make sure the href points to a directory
	dir.href += "/";
	const files = readdirSync(dir, { withFileTypes: true });
	const blueprint: Blueprint = {};
	for (const file of files)
		if (file.isDirectory()) {
			blueprint[file.name] = serveStatic(new URL(file.name, dir));
		} else if (file.isFile()) {
			blueprint[file.name] = {
				$get: serveFile(new URL(file.name, dir)),
			};
		}
	return blueprint;
};
