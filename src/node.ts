import { Request } from "./req";
import { Response } from "./res";
import { Blueprint, Handler, METHODS, Middleware, Params, Path } from "./utils";

export class Node {
	private methods: Partial<Record<METHODS, Handler[]>> = {};
	private middlewares: Middleware[] = [];
	private children: { [key: Path]: Node } = {};
	private wild: Wildcard;
	constructor(blueprint: Blueprint) {
		for (const key in blueprint)
			if (key === "$") this.middlewares = [blueprint[key]].flat(Infinity);
			// Both : and $$ are supported for wildcards because { $$wild } looks better than { ":wild": wild }.
			// Also, you can't export a variable that starts with a :
			else if (key.startsWith(":") || key.startsWith("$$"))
				this.wild = new Wildcard(blueprint[key], key.replace(/^:|\$\$/, ""));
			else if (key.startsWith("$"))
				this.methods[key.slice(1).toUpperCase()] = [blueprint[key]].flat(
					Infinity
				);
			else this.children[key] = new Node(blueprint[key]);
	}
	protected async pass(
		path: string[],
		req: Request,
		res: Response,
		params: Params
	): Promise<void> {
		for (const middleware of this.middlewares) {
			await middleware(req, res, params);
			if (res.writableEnded) return;
		}
		const part = path.shift();
		// Checks if part is "" (/path/) or undefined (/path)
		if (!part)
			if (this.methods[req.method]) {
				for (const handler of this.methods[req.method] as Handler[]) {
					await handler(req, res, params);
					if (res.writableEnded) return;
				}
				return;
			} else throw 404;
		if (this.children[part])
			return this.children[part].pass(path, req, res, params);
		else if (this.wild)
			return this.wild.pass(path, req, res, {
				...params,
				[this.wild.name]: decodeURIComponent(part.replace(/\+/g, " ")),
			});
		throw 404;
	}
}

class Wildcard extends Node {
	name: string;
	constructor(blueprint: Blueprint, name: string) {
		super(blueprint);
		this.name = name;
	}
}
