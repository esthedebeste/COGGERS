import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderFile } from "poggies";
import { test } from "uvu";
import { renderEngine, serveStatic } from "../src/coggers";
import { createFetch } from "./utils";

const _filename = import.meta.url ? fileURLToPath(import.meta.url) : __filename;
const assets = join(dirname(_filename), "assets");
test("Static Extension", async () => {
	const fetch = await createFetch({
		assets: serveStatic(assets),
	});
	await fetch("/assets/static.txt")
		.expect(200, "Hello World!")
		.expectHeader("Content-Type", /text\/plain/);
	fetch.close();
});

test("Render Extension", async () => {
	const fetch = await createFetch({
		ext: {
			$: renderEngine(renderFile, assets, "pog"),
			$get: (_req, res) => res.render("index", {}, { doctype: false }),
		},
		extless: {
			$: renderEngine(renderFile, assets),
			$get: (_req, res) => res.render("index.pog", {}, { doctype: false }),
		},
		params: {
			$: renderEngine(renderFile, assets, "pog"),
			$get: (_req, res) =>
				res.render("params", { name: "World" }, { doctype: false }),
		},
	});
	await fetch("/ext").expect(200, "<i>served from poggies :D</i>");
	await fetch("/extless").expect(200, "<i>served from poggies :D</i>");
	await fetch("/params").expect(200, "<b>Hello World!</b>");
	fetch.close();
});

test.run();
