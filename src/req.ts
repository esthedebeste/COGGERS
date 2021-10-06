import { IncomingMessage } from "node:http";

export class Request extends IncomingMessage {
	protocol: string;
	purl: URL;
	query: Record<string, string>;
	ip: string;
	secure: boolean;
	hostname: string;
	host: string;
	/**
	 * Extends IncomingMessage (Basically a constructor)
	 * @private
	 */
	extend(): Request {
		// @ts-expect-error Exists on HTTPS IncomingMessage
		this.secure = this.socket.encrypted;
		this.protocol = this.secure ? "https" : "http";
		this.purl = new URL(this.url, `${this.protocol}://${this.headers.host}`);
		this.query = Object.fromEntries(this.purl.searchParams.entries());
		this.hostname = this.purl.hostname;
		this.host = this.purl.host;
		this.ip = this.socket.remoteAddress;
		return this;
	}
	header(header: string): string | string[] {
		return this.headers[header.toLowerCase()];
	}
	getHeader(header: string): string | string[] {
		return this.header(header);
	}
	static extend(req: IncomingMessage): Request {
		const proto = Request.prototype;
		/* Support HTTPS by setting the `extends` of Request to the prototype of `req`.*/
		Object.setPrototypeOf(proto, Object.getPrototypeOf(req));
		Object.setPrototypeOf(req, proto);
		return (req as Request).extend();
	}
}
