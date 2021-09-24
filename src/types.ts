import { Request as Req } from "./req";
import { Response as Res } from "./res";
/** middleware adds keys sometimes */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Extended = Record<any, any>;
export type Request = Req & Extended;
export type Response = Res & Extended;
export type Handler = (req: Request, res: Response, params: Params) => void;
export type Middleware = Handler;
export type Options = {
	/** Defaults to "COGGERS" */
	xPoweredBy?: string;
	/** Defaults to `res.status(404).send("Not Found")` */
	notFound?: Handler;
};

export type Params = {
	[name: string]: string;
};
/** From import("node:http").METHODS */
type METHODS =
	| "ACL"
	| "BIND"
	| "CHECKOUT"
	| "CONNECT"
	| "COPY"
	| "DELETE"
	| "GET"
	| "HEAD"
	| "LINK"
	| "LOCK"
	| "M-SEARCH"
	| "MERGE"
	| "MKACTIVITY"
	| "MKCALENDAR"
	| "MKCOL"
	| "MOVE"
	| "NOTIFY"
	| "OPTIONS"
	| "PATCH"
	| "POST"
	| "PROPFIND"
	| "PROPPATCH"
	| "PURGE"
	| "PUT"
	| "REBIND"
	| "REPORT"
	| "SEARCH"
	| "SOURCE"
	| "SUBSCRIBE"
	| "TRACE"
	| "UNBIND"
	| "UNLINK"
	| "UNLOCK"
	| "UNSUBSCRIBE";
export type HTTPMethod = Lowercase<METHODS>;
export type Method = `$${HTTPMethod}`;
export type Wildcard = `:${string}`;
/* prettier-ignore */ /* temporary fix until there's a proper way to say that paths don't start with a $ */
type letters = "q"|"w"|"e"|"r"|"t"|"y"|"u"|"i"|"o"|"p"|"a"|"s"|"d"|"f"|"g"|"h"|"j"|"k"|"l"|"z"|"x"|"c"|"v"|"b"|"n"|"m";
type letter = Lowercase<letters> | Uppercase<letters>;
export type Path = `${letter}${string}`;
export type Blueprint = {
	[path: Path]: Blueprint;
	[param: Wildcard]: Blueprint;
} & Partial<Record<Method, Handler | Handler[]>> & { $?: Middleware[] };
