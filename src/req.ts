import { lookup } from "filename2mime";
import { IncomingMessage } from "node:http";
import { Accept } from "./accept";

export class Request extends IncomingMessage {
	private _accept: Accept;
	private get accept() {
		if (this._accept == null)
			this._accept = new Accept(this.headers.accept ?? "");
		return this._accept;
	}

	get secure(): boolean {
		// @ts-expect-error Exists on HTTPS IncomingMessage
		return this.socket?.encrypted;
	}
	get protocol(): "https" | "http" {
		return this.secure ? "https" : "http";
	}
	get purl(): URL {
		return new URL(this.url, `${this.protocol}://${this.host}`);
	}
	get query(): Record<string, string> {
		return Object.fromEntries(this.purl.searchParams.entries());
	}
	get hostname(): string {
		return this.purl.hostname;
	}
	get host(): string {
		return this.headers.host;
	}
	get ip(): string {
		return this.socket.remoteAddress;
	}

	header(header: string): string | string[] {
		return this.headers[header.toLowerCase()];
	}
	getHeader(header: string): string | string[] {
		return this.header(header);
	}

	/** Checks if requester would be fine with this mime. */
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
		return Object.setPrototypeOf(
			req,
			Object.setPrototypeOf(Request.prototype, Object.getPrototypeOf(req))
		) as Request;
	}
}
