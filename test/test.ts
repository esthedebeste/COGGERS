import cookieParser from "cookie-parser";
import ejs from "ejs";
import * as poggies from "poggies";
import { Coggers, express, renderEngine } from "../src/coggers.js";
// @ts-expect-error
const viewsDir = new URL("views", import.meta.url);

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
	gaming: {
		$$game: {
			$: [renderEngine(ejs.__express, viewsDir, "ejs")],
			$get(req, res, { game }) {
				res.render("gaming", {
					game,
					passed: req.passed,
				});
			},
		},
	},
	content: {
		$get(req, res) {
			req.format({
				html: () => res.send("<h1>Hi!</h1><i>text/html</i>"),
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
