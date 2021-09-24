import { Request } from "./req";
import { Response } from "./res";
import { Blueprint, Handler, HTTPMethod, Options, Params, Path } from "./types";

export class Node {
  methods: Partial<Record<HTTPMethod, Handler>> = {};
  alwayss: Handler[] = [];
  children: { [key: Path]: Node } = {};
  wild: Node;
  wildName: string;
  notFound: Handler;
  constructor(options: Options) {
    this.notFound = options.notFound;
  }
  method(method: HTTPMethod, handler: Handler) {
    this.methods[method] = handler;
  }
  always(handler: Handler) {
    this.alwayss.push(handler);
  }
  child(path: Path, node: Node) {
    this.children[path] = node;
  }
  wildcard(name: string, node: Node) {
    this.wild = node;
    this.wildName = name;
  }
  async pass(path: string[], req: Request, res: Response, params: Params) {
    for (const always of this.alwayss) {
      await always(req, res, params);
      if (res.writableEnded) return;
    }

    const part = path.shift();
    if (!part)
      if (this.methods[req.method])
        return this.methods[req.method](req, res, params);
      else return this.notFound(req, res, params);
    if (this.children[part])
      return this.children[part].pass(path, req, res, params);
    else if (this.wild)
      return this.wild.pass(path, req, res, {
        ...params,
        [this.wildName]: decodeURIComponent(part.replace(/\+/g, " ")),
      });
    return this.notFound(req, res, params);
  }

  static from(blueprint: Blueprint, options: Options) {
    const res = new Node(options);
    for (const key in blueprint)
      if (key === "$") for (const mw of blueprint[key]) res.always(mw);
      else if (key.startsWith("$"))
        res.method(key.slice(1).toUpperCase() as HTTPMethod, blueprint[key]);
      else if (key.startsWith(":"))
        res.wildcard(key.slice(1), Node.from(blueprint[key], options));
      else res.child(key as Path, Node.from(blueprint[key], options));
    return res;
  }
}
