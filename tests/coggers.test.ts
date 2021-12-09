import { readFileSync } from "node:fs";
import * as https from "node:https";
import { suite } from "uvu";
import * as assert from "uvu/assert";
import { createFetch } from "./utils";

const options = suite("Options");
options("HTTPS", async () => {
	const fetch = await createFetch(
		(req, res) => {
			assert.ok(req.secure);
			res.end("Hey!");
		},
		{
			serverCreator: https.createServer,
			createServerArgs: <https.ServerOptions>{
				cert: readFileSync(new URL("https/cert.pem", import.meta.url)),
				key: readFileSync(new URL("https/key.pem", import.meta.url)),
			},
		}
	);
	const agent = new https.Agent({ rejectUnauthorized: false });
	await fetch("/", { agent }).expect("Hey!");
	fetch.close();
});

options("notFound", async () => {
	const fetch = await createFetch(
		{},
		{
			notFound(_req, res) {
				res.status(404).send("Hey!");
			},
		}
	);
	await fetch("/").expect(404, "Hey!");
	fetch.close();
});

options("xPoweredBy", async () => {
	const xFalse = await createFetch((_req, res) => res.end(), {
		xPoweredBy: false,
	});
	await xFalse("/").expectHeader("X-Powered-By", null);
	xFalse.close();

	const custom = await createFetch((_req, res) => res.end(), {
		xPoweredBy: "foo",
	});
	await custom("/").expectHeader("X-Powered-By", "foo");
	custom.close();
});

options.run();
