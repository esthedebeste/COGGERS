import { Request as Req } from "./req";
import { Response as Res } from "./res";

/** middleware adds keys sometimes */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Extended = Record<any, any>;
export type Params<Added extends string = string> = Record<Added, string> & {
	/** Remaining part of the URL. Note: this is normalized to *always* have a '/' at the end. */
	$remaining: string;
};
export type Request = Req & Extended;
export type Response = Res & Extended;
export type Handler<P extends string = never> = (
	req: Request,
	res: Response,
	params: Params<P>
) => Promise<unknown> | unknown;
export type Middleware<P extends string = never> = Handler<P>;

/** From import("node:http").METHODS */
export type METHODS =
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
export type Method = `$${HTTPMethod | "any"}`;
export type Wildcard = `${":" | "$$"}${string}`;
/* prettier-ignore */ /* temporary fix until there's a proper way to say that paths don't start with a $ */
type urlchars = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"q"|"w"|"e"|"r"|"t"|"y"|"u"|"i"|"o"|"p"|"a"|"s"|"d"|"f"|"g"|"h"|"j"|"k"|"l"|"z"|"x"|"c"|"v"|"b"|"n"|"m"|"-"|"."|"_"|"~"|"["|"]"|"@"|"!"|"&"|"'"|"("|")"|"*"|"+"|","|";"|"%"|"=";
type pathstart = Lowercase<urlchars> | Uppercase<urlchars>;
export type Path = `${pathstart}${string}`;
export type Handlers<P extends string = never> =
	| Array<Handlers<P>>
	| Handler<P>;
export type Middlewares<P extends string = never> =
	| Array<Middlewares<P>>
	| Middleware<P>;
type extractParamName<raw> = raw extends `${"$$" | ":"}${infer R}` ? R : raw;
export type Blueprint<Params extends string = never> = {
	$?: Middlewares<Params>;
} & {
	/** https://github.com/microsoft/TypeScript/issues/22509 */
	[param in Wildcard]?: Blueprint<Params | extractParamName<param>>;
} & {
	[M in Method]?: Handlers<Params>;
} & {
	[path: Path]: Blueprint<Params>;
};
