import cookieParser from "cookie-parser";
import { Coggers, express } from "../src/coggers";
const server = new Coggers({
	$: [
		(req, res) => {
			if (Math.random() >= 0.9) {
				res.send({ middleware: { working: true } });
				console.info(`Canceled ${req.method} request to ${req.url}`);
			}
		},
		express(cookieParser()),
	],
	gaming: {
		$get(req, res) {
			res.send(req.cookies);
		},
		":game": {
			$get(_req, res, { game }) {
				res.send(`Yooo, any ${game} enjoyers?`);
			},
		},
	},
});
const port = process.env.PORT ?? 8080;
server.listen(port).then(() => {
	console.log(`Listening on http://localhost:${port}/`);
});
