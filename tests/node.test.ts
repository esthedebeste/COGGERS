import { test } from "uvu";
import { createFetch } from "./utils";
test("Not Found", async () => {
	const fetch = await createFetch({
		a: {
			$get(_req, res) {
				res.status(200).end();
			},
		},
	});
	await fetch("/a").expect(200);
	await fetch("/b").expect(404);
	fetch.close();
});

test("Params", async () => {
	const fetch = await createFetch({
		users: {
			$$id: {
				$get(_req, res, { id }) {
					res.send(id);
				},
			},
		},
	});
	await fetch("/users/123").expect(200, "123");
	fetch.close();
});

test("Methods", async () => {
	const fetch = await createFetch({
		$get(_req, res) {
			res.send("get");
		},
		$any(_req, res) {
			res.send("any");
		},
	});
	await fetch("/", { method: "GET" }).expect(200, "get");
	await fetch("/", { method: "POST" }).expect(200, "any");
	await fetch("/", { method: "PATCH" }).expect(200, "any");
	await fetch("/any").expect(404, "Not Found");
	fetch.close();
});

test("$remaining key", async () => {
	const fetch = await createFetch({
		$any: (_req, res, { $remaining }) => {
			res.send($remaining);
		},
		remaining: {
			$: (_req, res, { $remaining }) => {
				res.send($remaining);
			},
		},
	});
	await fetch("/").expect("/");
	await fetch("/remaining/parts/of/the/url/").expect("parts/of/the/url/");
	fetch.close();
});

test.run();
