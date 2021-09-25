import { Request } from "./req";
import { Response } from "./res";
import { Blueprint, Handler, HTTPMethod, Options, Params, Path } from "./types";

export class Node {
	methods: Partial<Record<HTTPMethod, Handler[]>> = {};
	alwayss: Handler[] = [];
	children: { [key: Path]: Node } = {};
	wild: Node;
	wildName: string;
	notFound: Handler;
	constructor(blueprint: Blueprint, options: Options) {
		this.notFound = options.notFound;
		for (const key in blueprint)
			if (key === "$") for (const mw of blueprint[key]) this.always(mw);
			else if (key.startsWith("$"))
				if (Array.isArray(blueprint[key]))
					for (const handler of blueprint[key])
						this.method(key.slice(1).toUpperCase() as HTTPMethod, handler);
				else
					this.method(key.slice(1).toUpperCase() as HTTPMethod, blueprint[key]);
			else if (key.startsWith(":"))
				this.wildcard(key.slice(1), new Node(blueprint[key], options));
			else this.child(key as Path, new Node(blueprint[key], options));
	}
	method(method: HTTPMethod, handler: Handler): void {
		this.methods[method] ??= [];
		this.methods[method].push(handler);
	}
	always(handler: Handler): void {
		this.alwayss.push(handler);
	}
	child(path: Path, node: Node): void {
		this.children[path] = node;
	}
	wildcard(name: string, node: Node): void {
		this.wild = node;
		this.wildName = name;
	}
	async pass(
		path: string[],
		req: Request,
		res: Response,
		params: Params
	): Promise<void> {
		for (const always of this.alwayss) {
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
			} else return this.notFound(req, res, params);
		if (this.children[part])
			return this.children[part].pass(path, req, res, params);
		else if (this.wild)
			return this.wild.pass(path, req, res, {
				...params,
				[this.wildName]: decodeURIComponent(part.replace(/\+/g, " ")),
			});
		return this.notFound(req, res, params);
	}
}
