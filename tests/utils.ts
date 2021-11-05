import { RequestListener, Server, ServerOptions } from "http";
import { FetchFunction, makeFetch } from "supertest-fetch";
import type { Test } from "uvu";
import { Blueprint, Coggers, Handler } from "../src/coggers";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const createCreateFetch = (test: Test) => {
	const servers: Server[] = [];
	test.after(() => {
		while (servers.length) servers.pop().close();
	});
	return async (
		blueprint: Blueprint,
		options?: {
			xPoweredBy?: string | false;
			notFound?: Handler<never>;
			serverCreator?: (
				options: ServerOptions,
				requestListener?: RequestListener
			) => Server;
			createServerArgs?: ServerOptions;
		}
	): Promise<FetchFunction> => {
		const server = await new Coggers(blueprint, options).listen(0);
		servers.push(server);
		return makeFetch(server);
	};
};
