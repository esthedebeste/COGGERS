import { Request } from "./req";
import { Response } from "./res";
import {
	Blueprint,
	Handler,
	HTTPMethod,
	Middleware,
	Params,
	Path,
} from "./types";

export class Node {
	methods: Partial<Record<HTTPMethod, Handler[]>> = {};
	middlewares: Middleware[] = [];
	children: { [key: Path]: Node } = {};
	wild: Wildcard;
	constructor(blueprint: Blueprint) {
		for (const key in blueprint)
			if (key === "$")
				this.middlewares = [blueprint[key]].flat() as Middleware[];
			else if (key.startsWith("$"))
				this.methods[key.slice(1).toUpperCase() as HTTPMethod] = [
					blueprint[key],
				].flat();
			else if (key.startsWith(":"))
				this.wild = new Wildcard(blueprint[key], key.slice(1));
			else this.children[key] = new Node(blueprint[key]);
	}
	async pass(
		path: string[],
		req: Request,
		res: Response,
		params: Params
	): Promise<void> {
		for (const always of this.middlewares) {
			await always(req, res, params);
			if (res.writableEnded) return;
		}
		const part = path.shift();
		if (!part)
			if (Array.isArray(this.methods[req.method])) {
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
