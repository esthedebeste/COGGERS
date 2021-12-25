import { renderFile } from "poggies";
import { suite } from "uvu";
import { renderEngine, serveStatic } from "../src/coggers";
import { createFetch } from "./utils";
const assets = new URL("assets", import.meta.url);
const staticc = suite("Static");
staticc("Serves Files", async () => {
	const fetch = await createFetch({
		assets: serveStatic(assets),
	});
	await fetch("/assets/static.txt")
		.expect(200, "Hello World!")
		.expectHeader("Content-Type", /text\/plain/);
	fetch.close();
});
staticc("Index Files", async () => {
	const fetch = await createFetch({
		assets: serveStatic(assets, { index: ["static.txt"] }),
	});
	await fetch("/assets")
		.expect(200, "Hello World!")
		.expectHeader("Content-Type", /text\/plain/);
	fetch.close();
});
staticc("Extless Files", async () => {
	const fetch = await createFetch({
		assets: serveStatic(assets, { ext: [".txt"] }),
	});
	await fetch("/assets/static")
		.expect(200, "Hello World!")
		.expectHeader("Content-Type", /text\/plain/);
	fetch.close();
});
staticc.run();

const render = suite("Render");
render("Render Extension", async () => {
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
render.run();
