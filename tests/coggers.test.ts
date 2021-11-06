import { readFileSync } from "fs";
import * as https from "https";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { suite } from "uvu";
import * as assert from "uvu/assert";
import { createFetch } from "./utils";
// TSM seems to compile to CJS, so import.meta.url doesn't exist on runtime.
const _dirname = import.meta.url
	? dirname(fileURLToPath(import.meta.url))
	: __dirname;

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
				cert: readFileSync(join(_dirname, "https", "cert.pem")),
				key: readFileSync(join(_dirname, "https", "key.pem")),
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
