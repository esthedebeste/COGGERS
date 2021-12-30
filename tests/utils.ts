import { RequestListener, Server, ServerOptions } from "node:http";
import { FetchFunction, makeFetch } from "supertest-fetch";
import { Blueprint, Coggers, Handler } from "../src/coggers";

export async function createFetch(
	blueprint: Blueprint | Handler,
	options?: {
		serverCreator?: {
			(requestListener?: RequestListener): Server;
			(options: ServerOptions, requestListener?: RequestListener): Server;
		};
		createServerArgs?: ServerOptions;
		notFound?: Handler;
		xPoweredBy?: string | false;
	}
): Promise<FetchFunction & { close?: () => void; server?: Coggers }> {
	const coggers = new Coggers(
		typeof blueprint === "function" ? { $: blueprint } : blueprint,
		options
	);
	const server = await coggers.listen(0);
	const fetch: FetchFunction & { close?: () => void; server?: Coggers } =
		makeFetch(server);
	fetch.close = () => server.close();
	fetch.server = coggers;
	return fetch;
}
