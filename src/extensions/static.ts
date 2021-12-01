import { PathLike, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { Blueprint, Middleware } from "../utils";

const serveFile =
	(file: PathLike): Middleware =>
	(_req, res) =>
		res.sendFile(file);

export const serveStatic = (folder: string | URL): Blueprint => {
	if (typeof folder === "string") folder = pathToFileURL(folder);
	// make sure the href points to a directory
	folder.href += "/";
	const files = readdirSync(folder, { withFileTypes: true });
	const blueprint: Blueprint = {};
	for (const file of files)
		if (file.isDirectory()) {
			blueprint[file.name] = serveStatic(new URL(file.name, folder));
		} else if (file.isFile()) {
			blueprint[file.name] = {
				$get: serveFile(new URL(file.name, folder)),
			};
		}
	return blueprint;
};
