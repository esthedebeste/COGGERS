import cookieParser from "cookie-parser";
import ejs from "ejs";
import { fileURLToPath } from "node:url";
import * as poggies from "poggies";
import { Coggers, express, renderEngine } from "../src/coggers.js";
// @ts-ignore
const url = import.meta.url;
const viewsDir = new URL("views", url);

const server = new Coggers({
	$: [
		(req, res) => {
			if (Math.random() >= 0.9) {
				console.info(`Canceled ${req.method} request to ${req.url}`);
				return res.send({ middleware: { working: true } });
			}
			req.passed = true;
		},
		renderEngine(poggies.renderFile, viewsDir, "pog"),
	],
	$get(_req, res) {
		res.render("index");
	},
	cookies: {
		$: [express(cookieParser())],
		$get(req, res) {
			res.send(req.cookies);
		},
	},
	params: {
		$$param: {
			$: [renderEngine(ejs.__express, viewsDir, "ejs")],
			$get(req, res, { param }) {
				res.render("params", {
					param,
					passed: req.passed,
				});
			},
		},
	},
	content: {
		$get(req, res) {
			req.format({
				html: () => res.sendFile(fileURLToPath(new URL("public/hi.html", url))),
				json: () => res.send({ text: "Hi!", from: "application/json" }),
				txt: () => res.type("txt").send("Hi! (text/plain)"),
				default: () => res.end("Hi!"),
			});
		},
	},
});
const port = process.env.PORT ?? 8080;
server.listen(port).then(() => {
	console.log(`Listening on http://localhost:${port}/`);
});
