import ejs from "ejs";
import { readFileSync } from "node:fs";
import { createServer } from "node:https";
import * as poggies from "poggies";
import { Coggers, renderEngine } from "../src/coggers.js";
// @ts-ignore
const url = import.meta.url;
const viewsDir = new URL("views", url);

const server = new Coggers(
	{
		$: [
			(req, res) => {
				if (req.query.cancel) {
					console.info(
						`Canceled ${req.method} request to ${req.purl.pathname}`
					);
					return res.send({ middleware: { working: true } });
				}
			},
			renderEngine(poggies.renderFile, viewsDir, "pog"),
		],
		$get(_req, res) {
			res.render("index");
		},
		cookies: {
			$get(req, res) {
				const count = parseInt(req.cookies.count);
				if (isNaN(count)) return res.cookie("count", "1").send("Refresh!");
				if (count > 2.5)
					return res
						.cookie("count", "0", { maxAge: 0 })
						.send("/* TODO: Numbers after 2.5 */");
				res
					.cookie("count", String(count + 1))
					.send(`You've refreshed ${count} time(s)!`);
			},
		},
		params: {
			$$param: {
				$: [renderEngine(ejs.__express, viewsDir, "ejs")],
				$get(req, res, { param }) {
					res.render("params", { param });
				},
			},
		},
		content: {
			$get(req, res) {
				req.format({
					html: () => res.sendFile(new URL("public/hi.html", url)),
					json: () => res.send({ text: "Hi!", from: "application/json" }),
					txt: () => res.type("txt").send("Hi! (text/plain)"),
					default: () => res.end("Hi!"),
				});
			},
		},
		download: {
			$get(req, res) {
				res.download(new URL("public/hi.html", url), "hi.html");
			},
		},
	},
	{
		serverCreator: createServer,
		createServerArgs: {
			key: readFileSync(new URL("https/key.pem", url)),
			cert: readFileSync(new URL("https/cert.pem", url)),
		},
	}
);
const port = process.env.PORT ?? 8080;
server.listen(port).then(() => {
	console.log(`Listening on https://localhost:${port}/`);
});
