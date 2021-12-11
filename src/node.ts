import { Request } from "./req";
import { Response } from "./res";
import { Blueprint, Handler, METHODS, Middleware, Params, Path } from "./utils";

/** @internal */
export type BoundHandler = () => ReturnType<Handler>;
const Inf = Number.POSITIVE_INFINITY;
export class Node {
	public readonly blueprint: Blueprint;
	private methods: Partial<Record<METHODS | "ANY", Handler[]>> = {};
	private middlewares: Middleware[] = [];
	private children: { [key: Path]: Node } = {};
	private wild: Wildcard;
	constructor(blueprint: Blueprint) {
		this.blueprint = blueprint;
		for (const key in blueprint)
			if (key === "$") this.middlewares = [blueprint[key]].flat(Inf);
			// Both : and $$ are supported for wildcards because { $$wild } looks better than { ":wild": wild }.
			// Also, you can't export a variable that starts with a :
			else if (key.startsWith(":") || key.startsWith("$$"))
				this.wild = new Wildcard(blueprint[key], key.replace(/^:|\$\$/, ""));
			else if (key.startsWith("$"))
				this.methods[key.slice(1).toUpperCase()] = [blueprint[key]].flat(Inf);
			else this.children[key] = new Node(blueprint[key]);
	}
	/** @internal */
	protected pass(
		path: string[],
		req: Request,
		res: Response,
		params: Params,
		notFound: Handler
	): BoundHandler[] {
		const part = path.shift();
		const mw = this.middlewares.map(mw =>
			mw.bind(null, req, res, { ...params, $remaining: path.join("/") || "/" })
		);
		return mw.concat(
			part
				? this.children[part]
					? this.children[part].pass(path, req, res, params, notFound)
					: this.wild
					? this.wild.pass(
							path,
							req,
							res,
							{
								...params,
								[this.wild.name]: decodeURIComponent(part.replace(/\+/g, " ")),
							},
							notFound
					  )
					: notFound.bind(null, req, res, {
							...params,
							$remaining: path.join("/") || "/",
					  })
				: // If part is "" (/path/) or undefined (/path)
				  (
						this.methods[req.method as METHODS] ||
						this.methods.ANY || [notFound]
				  ).map(handler =>
						handler.bind(null, req, res, {
							...params,
							$remaining: path.join("/") || "/",
						})
				  )
		);
	}
}

class Wildcard extends Node {
	constructor(blueprint: Blueprint, public name: string) {
		super(blueprint);
	}
}
