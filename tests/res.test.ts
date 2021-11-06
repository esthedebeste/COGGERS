import * as filename2mime from "filename2mime";
import { fileURLToPath } from "node:url";
import { test } from "uvu";
import * as assert from "uvu/assert";
import { createFetch } from "./utils";
// TSM seems to compile to CJS, so import.meta.url doesn't exist on runtime.
const _filename = import.meta.url ? fileURLToPath(import.meta.url) : __filename;
test("Header Methods / Header Proxy", async () => {
	const fetch = await createFetch((req, res) => {
		switch (req.url) {
			case "/a":
				res.headers.Foo = "bar";
				break;
			case "/b":
				res.set("Foo", "bar");
				break;
			case "/c":
				res.set({ Foo: "bar" });
				break;
		}
		res.send();
	});
	await fetch("/a").expect("Foo", "bar");
	await fetch("/b").expect("Foo", "bar");
	await fetch("/c").expect("Foo", "bar");
	fetch.close();
});

test("Etagging", async () => {
	const fetch = await createFetch((_req, res) => {
		assert.instance(res.etagEnd("Hi!"), Promise);
	});
	const first = await fetch("/").expect("Hi!");
	const etag = first.headers.get("ETag");
	await fetch("/", { headers: { "If-None-Match": etag } })
		.expect(304, /* no body */ null)
		.expectHeader("ETag", etag);
	fetch.close();
});

test("Status functions", async () => {
	const fetch = await createFetch({
		$get(_req, res) {
			res.status(200).end();
		},
		404: {
			$get(_req, res) {
				res.sendStatus(404);
			},
		},
	});
	await fetch("/").expect(200);
	await fetch("/404").expect(404);
	fetch.close();
});

test("Send functions", async () => {
	const fetch = await createFetch((req, res) => {
		switch (req.url) {
			case "/json":
				return res.json({ foo: "bar" });
			case "/html":
				return res.html("<b>Foo: bar</b>");
			case "/download":
				return res.download(_filename, "res.test.ts");
			case "/file":
				return res.sendFile(_filename);
			default:
				res.send("Invalid path");
		}
	});
	await fetch("/json").expect({ foo: "bar" });
	await fetch("/html").expect("<b>Foo: bar</b>");
	await fetch("/download")
		.expect(/await fetch\("\/download"\)/)
		.expectHeader("Content-Disposition", `attachment; filename="res.test.ts"`)
		.expectHeader("Content-Type", filename2mime.mime["ts"]);
	await fetch("/file")
		.expect(/await fetch\("\/file"\)/)
		.expect("Content-Disposition", "inline")
		.expect("Content-Type", filename2mime.mime["ts"]);
	fetch.close();
});

test("Cookie serialization", async () => {
	const fetch = await createFetch((_req, res) =>
		res
			.cookie("foo", "bar", {
				domain: "localhost",
				expires: new Date(),
				maxAge: 20,
				httpOnly: true,
				path: "/",
				sameSite: "Strict",
				secure: true,
			})
			.send()
	);
	const res = await fetch("/").expect(200);
	// Make sure the Set-Cookie header exists
	const cookie = res.headers
		.get("Set-Cookie")
		.split(";")
		.map(str => str.trim());
	assert.ok(cookie.includes("foo=bar"));
	assert.ok(cookie.includes("Domain=localhost"));
	// Max-Age overrides Expires
	assert.not.ok(cookie.find(str => str.includes("Expires")));
	assert.ok(cookie.includes("Max-Age=20"));
	assert.ok(cookie.includes("HttpOnly"));
	assert.ok(cookie.includes("Path=/"));
	assert.ok(cookie.includes("SameSite=Strict"));
	assert.ok(cookie.includes("Secure"));
	fetch.close();
});

test("res.type", async () => {
	const fetch = await createFetch((_req, res) =>
		res.type("html").end("<b>Hi!</b>")
	);
	await fetch("/").expect("Content-Type", "text/html");
	fetch.close();
});

test("res.redirect", async () => {
	const fetch = await createFetch({
		$get(_req, res) {
			res.redirect("/other");
		},
		other: {
			$get(_req, res) {
				res.send("Hi!");
			},
		},
	});
	await fetch("/", { redirect: "manual" }).expect(302);
	await fetch("/").expect("Hi!");
	await fetch("/other").expect("Hi!");
	fetch.close();
});

// res.render will be in the tests/extensions dir

test.run();
