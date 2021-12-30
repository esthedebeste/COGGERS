import { Request } from "./req";
import { Response } from "./res";
import { Blueprint, Handler, Method, Middleware, Params, Path } from "./utils";

/** @internal */
export type BoundHandler = () => ReturnType<Handler>;
const Inf = Number.POSITIVE_INFINITY;
/** @internal */
const wildkey = Symbol("wildkey");
/** @internal */
const wildname = Symbol("wildname");
/** @internal */
export const pass = Symbol("pass");
const has = Object.prototype.hasOwnProperty;
/**	@internal */
export class Node implements Blueprint {
	[x: `:${string}`]: Node;
	[x: `$$${string}`]: Node;
	[x: Path]: Node;
	// postfixing ${string} is a weird way to get TS to accept a string union. $getHelloWorld does not exist, but this'll say it is. nasty side-effect.
	[x: `${Method}${string}`]: Handler[];
	$?: Middleware[];
	constructor(blueprint: Blueprint) {
		const node = Object.setPrototypeOf(blueprint, Node.prototype);
		for (const key in node)
			if (key === "$") node.$ = [blueprint[key]].flat(Inf);
			// Both : and $$ are supported for wildcards because { $$wild } looks better than { ":wild": wild }.
			// Also, you can't export a variable that starts with a ':'
			else if (key.startsWith(":") || key.startsWith("$$")) {
				node[key] = new Node(blueprint[key]);
				node[wildkey] = key;
				node[wildname] = key.replace(/^:|\$\$/, "");
			} else if (key.startsWith("$")) node[key] = [blueprint[key]].flat(Inf);
			else node[key] = new Node(blueprint[key]);
		return node;
	}
	/** @internal */
	[wildkey]: string;
	/** @internal */
	[wildname]: string;
	/** @internal */
	[pass](
		remaining: string,
		req: Request,
		res: Response,
		params: Params,
		notFound: Handler
	): BoundHandler[] {
		const slashI = remaining.indexOf("/");
		const mw = has.call(this, "$")
			? this.$.map(mw =>
					mw.bind(null, req, res, { ...params, $remaining: remaining || "/" })
			  )
			: [];
		if (slashI > 0) {
			const origPart = remaining.slice(0, slashI);
			let part = origPart;
			remaining = remaining.slice(slashI + 1);
			// not sure what to do in this situation. currently, paths starting with a '$' or a ':' have to be prefixed with '__' (two underscores). might not be permanent behavior.
			if (part[0] === "$" || part[0] === ":") part = "__" + part;
			return mw.concat(
				has.call(this, part)
					? this[part][pass](remaining, req, res, params, notFound)
					: this[wildkey]
					? this[this[wildkey]][pass](
							remaining,
							req,
							res,
							{
								...params,
								[this[wildname]]: decodeURIComponent(
									origPart.replace(/\+/g, " ")
								),
							},
							notFound
					  )
					: notFound.bind(null, req, res, {
							...params,
							$remaining: remaining || "/",
					  })
			);
		} else {
			const method = ("$" + req.method.toLowerCase()) as Method;
			return mw.concat(
				(this[method] || this.$any || [notFound]).map(handler =>
					handler.bind(null, req, res, {
						...params,
						$remaining: "/",
					})
				)
			);
		}
	}
}
