import { IncomingMessage, Server, ServerResponse } from "node:http";
import { Node } from "./node";
import { Request } from "./req";
import { Response } from "./res";
import { Blueprint, HTTPMethod, Options, Params, Path } from "./types";
export class Coggers extends Node {
  options: Options;
  server: Server;
  constructor(blueprint: Blueprint, options?: Options) {
    options = {
      xPoweredBy: "COGGERS",
      notFound: (_, res) => res.status(404).send("Not Found"),
      ...options,
    };
    super(options);
    this.options = options;

    for (const key in blueprint)
      if (key === "$") for (const mw of blueprint[key]) this.always(mw);
      else if (key.startsWith("$"))
        this.method(key.slice(1).toLowerCase() as HTTPMethod, blueprint[key]);
      else this.child(key as Path, Node.from(blueprint[key], this.options));
    this.server = new Server(this.reqres.bind(this));
  }
  reqres(rawreq: IncomingMessage, rawres: ServerResponse) {
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
    const params: Params = Object.setPrototypeOf(() => {}, {});
    this.pass(path, req, res, params);
  }
  listen(port: number | string, host?: string) {
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
export const blueprint = (blueprint: Blueprint) => blueprint;
export default Coggers;
export { express } from "./compat";
export type {
  Blueprint,
  Handler,
  HTTPMethod,
  Middleware,
  Options,
} from "./types";
