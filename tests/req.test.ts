import { test } from "uvu";
import * as assert from "uvu/assert";
import { createFetch } from "./utils";

test("Header Methods", async () => {
	const date = new Date().toUTCString();
	const fetch = await createFetch({
		$get(req, res) {
			assert.equal(req.headers.date, date);
			assert.equal(req.getHeader("date"), date);
			assert.equal(req.header("date"), date);
			res.end();
		},
	});
	await fetch("/", {
		headers: {
			Date: date,
		},
	}).expect(200);
	fetch.close();
});

test("Static Fields", async () => {
	const fetch = await createFetch((req, res) => {
		assert.instance(req.purl, URL);
		assert.ok(/^localhost:\d+$/.test(req.host));
		assert.equal(req.hostname, "localhost");
		assert.equal(req.query.test, "foo");
		assert.ok(req.ip.includes("127.0.0.1") || req.ip.includes("::1"));
		assert.equal(req.secure, false);
		assert.equal(req.protocol, "http");
		res.end();
	});

	await fetch("/?test=foo").expect(200);
	fetch.close();
});

test("Accept header parsing", async () => {
	const fetch = await createFetch((req, res) => {
		const html = req.acceptsMime("text/html");
		const txt = req.acceptsMime("text/plain");
		const pref = req.preferredMime([
			"text/html",
			"text/plain",
			"application/json",
		]);
		req.format({
			html: () => res.end(`<b>HTML: ${html}, TXT: ${txt}, PREF: ${pref}</b>`),
			json: () => res.end(JSON.stringify({ html, txt, pref })),
			default: () => res.end(`HTML: ${html}, TXT: ${txt}, PREF: ${pref}`),
		});
	});
	await fetch("/", {
		headers: {
			// Prefers application/json over text/*, because of specificity.
			accept: "text/*, application/json",
		},
	}).expect(`{"html":true,"txt":true,"pref":"application/json"}`);
	await fetch("/", {
		headers: {
			// Prefers text/html over application/json, because of q.
			accept: "application/json; text/html; q=0.9",
		},
	}).expect({ html: true, txt: false, pref: "application/json" });
	await fetch("/", {
		headers: {
			// Prefers application/json over text/html, because of order.
			accept: "application/*, text/*",
		},
	}).expect(`{"html":true,"txt":true,"pref":"application/json"}`);

	await fetch("/", { headers: { accept: "text/html" } }).expect(
		`<b>HTML: true, TXT: false, PREF: text/html</b>`
	);
	await fetch("/", { headers: { accept: "image/png" } }).expect(
		// Unknown => default.
		`HTML: false, TXT: false, PREF: undefined`
	);
	fetch.close();
});

test("Cookie parsing", async () => {
	const fetch = await createFetch((req, res) => res.end(req.cookies.test));
	await fetch("/", {
		headers: {
			cookie: "test=foo",
		},
	}).expect("foo");
	await fetch("/", {
		headers: {
			cookie: "a=3; test=foo; b=5",
		},
	}).expect("foo");
	fetch.close();
});

test.run();
