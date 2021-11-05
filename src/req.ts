import { lookup } from "filename2mime";
import { IncomingMessage } from "node:http";
import { Accept } from "./accept";
import * as cookie from "./cookie";

export class Request extends IncomingMessage {
	private _accept: Accept;
	private get accept() {
		return (this._accept ??= new Accept(this.headers.accept ?? ""));
	}

	purl: URL;
	query: Record<string, string>;
	secure: boolean;
	protocol: "https" | "http";
	host: string;
	hostname: string;
	ip: string;
	cookies: Record<string, string>;
	_init(): this {
		// @ts-ignore exists on TLSSocket
		this.secure = this.socket.encrypted ?? false;
		this.protocol = this.secure ? "https" : "http";
		this.ip = this.socket.remoteAddress;
		this.purl = new URL(
			this.url,
			`${this.protocol}://${this.headers.host ?? this.headers[":authority"]}`
		);
		this.host = this.purl.host;
		this.hostname = this.purl.hostname;
		this.query = Object.fromEntries(this.purl.searchParams);
		this.cookies = this.headers.cookie ? cookie.parse(this.headers.cookie) : {};
		return this;
	}

	header(header: string): string | string[] {
		return this.headers[header.toLowerCase()];
	}
	getHeader(header: string): string | string[] {
		return this.header(header);
	}

	acceptsMime(mime: string): boolean {
		return this.accept.accepts(mime);
	}

	preferredMime(mimes: string[]): string {
		return this.accept.preferred(mimes);
	}

	/**
	 * Like a switch case, but for the requested Content-Type
	 * Accepts extensions ("txt" instead of "text/plain")
	 * @example
	 * req.format({
	 *   html: () => res.send("<h1>Hi!</h1>"),
	 *   json: () => res.json({ text: "Hi!" }),
	 *   txt:  () => res.type("txt").send("Hi!"),
	 *   default: () => res.send("Hi?"),
	 * });
	 */
	format(types: Record<string, () => void>): void {
		const absolute: Record<string, () => void> = {};
		for (const type in types)
			if (type === "default") absolute["*/*"] = types[type];
			else if (type.includes("/")) absolute[type] = types[type];
			else absolute[lookup(type)] = types[type];
		const prefers = this.accept.preferred(Object.keys(absolute));
		if (prefers == null) return;
		return absolute[prefers]();
	}

	static extend(req: IncomingMessage): Request {
		/* Support HTTPS by setting the `extends` of Request to the prototype of `req`. */
		return (
			Object.setPrototypeOf(
				req,
				Object.setPrototypeOf(Request.prototype, Object.getPrototypeOf(req))
			) as Request
		)._init();
	}
}
