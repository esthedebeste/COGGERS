import { Coggers } from "coggers";
import { readFileSync } from "fs";
import { createServer } from "https";
const coggers = new Coggers(
	{
		users: {
			$$id: {
				$get(req, res, { id }) {
					res.send(`Hey, user ${id}`);
				},
			},
		},
	},
	{
		serverCreator: createServer,
		createServerArgs: {
			key: readFileSync(new URL("../key.pem", import.meta.url)),
			cert: readFileSync(new URL("../cert.pem", import.meta.url)),
		},
	}
);

coggers
	.listen(8080)
	.then(() =>
		console.log("Listening! Try it out, https://localhost:8080/users/foo")
	);
