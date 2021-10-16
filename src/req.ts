import { IncomingMessage } from "node:http";

export class Request extends IncomingMessage {
	get secure(): boolean {
		// @ts-expect-error Exists on HTTPS IncomingMessage
		return this.socket?.encrypted;
	}
	get protocol(): "https" | "http" {
		return this.secure ? "https" : "http";
	}
	get purl(): URL {
		return new URL(this.url, `${this.protocol}://${this.headers.host}`);
	}
	get query(): Record<string, string> {
		return Object.fromEntries(this.purl.searchParams.entries());
	}
	get hostname(): string {
		return this.purl.hostname;
	}
	get host(): string {
		return this.purl.host;
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
	static extend(req: IncomingMessage): Request {
		/* Support HTTPS by setting the `extends` of Request to the prototype of `req`. */
		return Object.setPrototypeOf(
			req,
			Object.setPrototypeOf(Request.prototype, Object.getPrototypeOf(req))
		) as Request;
	}
}
