import { IncomingMessage, Server, ServerResponse } from "node:http";
import { Node } from "./node";
import { Request } from "./req";
import { Response } from "./res";
import { Blueprint, Options, Params } from "./types";
export class Coggers extends Node {
	options: Options;
	constructor(blueprint: Blueprint, options?: Options) {
		super(blueprint);
		options = {
			xPoweredBy: "COGGERS",
			notFound: (_, res) => res.status(404).send("Not Found"),
			...options,
		};
		this.options = options;
	}
	reqres(rawreq: IncomingMessage, rawres: ServerResponse): void {
		const req = Request.extend(rawreq);
		const res = Response.extend(rawres);

		res.headers["X-Powered-By"] = this.options.xPoweredBy ?? "COGGERS";

		const path = req.purl.pathname.slice(1).split("/");
		/**
		 * A bit of a hack which will allow express-style middleware to be used
		 * by turning the params object into a callable function (like express's `next()`)
		 * while also removing all prototypes from said function.
		 */
		// @ts-ignore because setPrototype might not return an `any` in the future
		const params: Params = Object.setPrototypeOf(() => void 0, {});
		this.pass(path, req, res, params).catch(error => {
			if (error === 404) this.options.notFound(req, res, params);
		});
	}
	listen(port: number | string, host?: string): Promise<Server> {
		const server = new Server(this.reqres.bind(this));
		return new Promise(resolve => {
			server.listen(
				{
					port,
					host,
				},
				() => resolve(server)
			);
		});
	}
}
/** Funky little function to wrap around your blueprints so that your IDE can autocomplete things */
export const blueprint = (blueprint: Blueprint): Blueprint => blueprint;
export default Coggers;
export { express } from "./compat";
export * from "./extensions/mod";
export type {
	Blueprint,
	Handler,
	HTTPMethod,
	Middleware,
	Options,
	Request,
	Response,
} from "./types";
