import * as http from "node:http";
import { Node } from "./node";
import { Request } from "./req";
import { Response } from "./res";
import type { Blueprint, Handler, Params } from "./utils";
export type Options = ConstructorParameters<typeof Coggers>[1];

export class Coggers<
	SC extends (...args) => {
		listen(opts: { port: number | string; host: string }, cb: () => void): void;
	} = typeof http.createServer
> extends Node {
	protected options: Options;
	server: ReturnType<SC>;
	constructor(
		blueprint: Blueprint,
		options?: {
			/** Defaults to "COGGERS" */
			xPoweredBy?: string | false;
			/** Defaults to `res.status(404).send("Not Found")` */
			notFound?: Handler;
			/** http.createServer, https.createServer, etc. */
			serverCreator?: SC;
			/** Arguments to http.createServer, https.createServer, etc. */
			createServerArgs?: Parameters<SC>[0];
		}
	) {
		super(blueprint);
		this.options = {
			xPoweredBy: "COGGERS",
			notFound: (_, res) => res.status(404).send("Not Found"),
			serverCreator: http.createServer,
			createServerArgs: {},
			...options,
		};

		// @ts-ignore
		this.server = this.options.serverCreator(
			{
				...this.options.createServerArgs,
				IncomingMessage: Request,
				ServerResponse: Response,
			},
			this.handle.bind(this)
		);
	}

	reqres(
		rawreq: http.IncomingMessage,
		rawres: http.ServerResponse
	): Promise<void> {
		const req = Request.extend(rawreq);
		const res = Response.extend(rawres);
		return this.handle(req, res);
	}

	protected async handle(req: Request, res: Response): Promise<void> {
		req._init();
		// Below node v15.7.0
		if (!res.req) res.req = req;
		if (this.options.xPoweredBy !== false)
			res.headers["X-Powered-By"] = this.options.xPoweredBy;
		const path = req.purl.pathname.slice(1).split("/");
		const params: Params = { $remaining: path.join("/") || "/" };
		const notFound = this.options.notFound;
		const handlers = this.pass(path, req, res, params, notFound);
		for (const handler of handlers) {
			await handler();
			if (res.writableEnded) break;
		}
	}

	listen(port: number | string, host?: string): Promise<ReturnType<SC>> {
		return new Promise(resolve => {
			this.server.listen(
				{
					port,
					host,
				},
				() => resolve(this.server)
			);
		});
	}
}
/** Funky little function to wrap around your blueprints so that your IDE can autocomplete things */
export const blueprint = (blueprint: Blueprint): Blueprint => blueprint;
export default Coggers;
export { express } from "./compat";
export * from "./extensions/mod";
export { Request } from "./req";
export { Response } from "./res";
export type { Blueprint, Handler, HTTPMethod, Middleware } from "./utils";
