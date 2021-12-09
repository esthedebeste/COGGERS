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
): Promise<FetchFunction & { close?: () => void }> {
	const server = await new Coggers(
		typeof blueprint === "function" ? { $: blueprint } : blueprint,
		options
	).listen(0);
	const fetch: FetchFunction & { close?: () => void } = makeFetch(server);
	fetch.close = () => server.close();
	return fetch;
}
