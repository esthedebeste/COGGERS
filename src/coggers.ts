import { IncomingMessage, Server, ServerResponse } from "node:http";
import { Node } from "./node";
import { Request } from "./req";
import { Response } from "./res";
import type { Blueprint, Handler, Params } from "./utils";
export type Options = {
	/** Defaults to "COGGERS" */
	xPoweredBy?: string | false;
	/** Defaults to `res.status(404).send("Not Found")` */
	notFound?: Handler;
};

export class Coggers extends Node {
	protected options: Options;
	constructor(blueprint: Blueprint, options?: Options) {
		super(blueprint);
		this.options = {
			xPoweredBy: "COGGERS",
			notFound: (_, res) => res.status(404).send("Not Found"),
			...options,
		};
	}

	reqres(rawreq: IncomingMessage, rawres: ServerResponse): Promise<void> {
		const req = Request.extend(rawreq);
		const res = Response.extend(rawres);
		return this.handle(req, res);
	}

	protected handle(req: Request, res: Response): Promise<void> {
		if (this.options.xPoweredBy !== false)
			res.headers["X-Powered-By"] = this.options.xPoweredBy;
		const path = req.purl.pathname.slice(1).split("/");
		const params: Params = {};
		return this.pass(path, req, res, params).catch(error => {
			if (error === 404) this.options.notFound(req, res, params);
			else throw error;
		});
	}

	listen(port: number | string, host?: string): Promise<Server> {
		const server = new Server(
			{
				// node:http allows us to directly extend IncomingMessage
				IncomingMessage: Request,
				ServerResponse: Response,
			},
			this.handle.bind(this)
		);
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
	Request,
	Response,
} from "./utils";
