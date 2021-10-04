import cookieParser from "cookie-parser";
import * as poggies from "poggies";
import { Coggers, express, renderEngine } from "../src/coggers.js";
// @ts-expect-error
const viewsDir = new URL("views", import.meta.url);

const server = new Coggers({
	$: [
		(req, res) => {
			if (Math.random() >= 0.9) {
				res.send({ middleware: { working: true } });
				console.info(`Canceled ${req.method} request to ${req.url}`);
			}
		},
		express(cookieParser()),
		renderEngine(poggies.renderFile, viewsDir, "pog"),
	],
	gaming: {
		$get(req, res) {
			res.send(req.cookies);
		},
		":game": {
			$get(_req, res, { game }) {
				res.send(`Yooo, any ${game} enjoyers?`);
			},
			promise: {
				$get(_req, res, { game }) {
					res.render("gaming", {
						game,
						type: "promise",
					});
				},
			},
			callback: {
				$: [renderEngine(poggies.__express, viewsDir, "pog")],
				$get(_req, res, { game }) {
					res.render("gaming", {
						game: game,
						type: "callback",
					});
				},
			},
		},
	},
});
const port = process.env.PORT ?? 8080;
server.listen(port).then(() => {
	console.log(`Listening on http://localhost:${port}/`);
});
