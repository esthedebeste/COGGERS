import { RequestListener, Server, ServerOptions } from "http";
import { FetchFunction, makeFetch } from "supertest-fetch";
import { Blueprint, Coggers, Handler } from "../src/coggers";

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

export async function createFetch(
	blueprint: Blueprint | Handler,
	options?: {
		xPoweredBy?: string | false;
		notFound?: Handler<never>;
		serverCreator?: (
			options: ServerOptions,
			requestListener?: RequestListener
		) => Server;
		createServerArgs?: ServerOptions;
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
