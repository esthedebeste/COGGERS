import { lookup, mime } from "filename2mime";
import { createReadStream } from "node:fs";
import { ServerResponse } from "node:http";
import { ResRender } from "./extensions/render";

export class Response extends ServerResponse {
	get headers(): Record<string, string | number | string[]> {
		return new Proxy(
			{},
			{
				/* Use lambdas instead of functions to make `this` refer to res and not the proxy */
				get: (_, name: string) => {
					return this.getHeader(name);
				},
				set: (_, name: string, value) => {
					this.setHeader(name, value);
					return true;
				},
				deleteProperty: (_, name: string) => {
					this.removeHeader(name);
					return true;
				},
				has: (_, name: string) => {
					return this.hasHeader(name);
				},
			}
		);
	}

	status(code: number, message?: string): Response {
		this.statusCode = code;
		if (message) this.statusMessage = message;
		return this;
	}

	sendStatus(code: number, message?: string): void {
		this.status(code, message).end();
	}

	json(data: unknown): void {
		this.headers["Content-Type"] ??= "application/json; charset=UTF-8";
		this.end(JSON.stringify(data));
	}

	html(data: string): void {
		this.headers["Content-Type"] ??= "text/html; charset=UTF-8";
		this.end(data);
	}

	send(data: unknown): void {
		if (data instanceof Uint8Array) {
			this.headers["Content-Type"] ??= "application/octet-stream";
			this.end(data);
		} else if (typeof data === "string") this.html(data);
		else if (data == null) this.end();
		else this.json(data);
	}

	sendFile(file: string): void {
		this.headers["Content-Type"] ??= lookup(file);
		createReadStream(file).pipe(this);
	}

	set(headers: Record<string, string | number | string[]>): Response;
	set(header: string, value: string | number | string[]): Response;
	set(
		header: string | Record<string, string | number | string[]>,
		value?: string | number | string[]
	): Response {
		if (typeof header === "object")
			for (const key in header) this.headers[key] = header[key];
		else this.headers[header] = value;
		return this;
	}

	redirect(url: string, status?: number): void {
		this.status(status || 302);
		this.headers.Location = url;
		this.end();
	}

	type(type: string): Response {
		if (type.includes("/")) this.headers["Content-Type"] = type;
		else if (mime[type]) this.headers["Content-Type"] = mime[type];
		return this;
	}

	static extend(res: ServerResponse): Response {
		/* Support HTTPS by setting the `extends` of Response to the prototype of `res`. */
		return Object.setPrototypeOf(
			res,
			Object.setPrototypeOf(Response.prototype, Object.getPrototypeOf(res))
		) as Response;
	}

	/** Only defined after using renderEngine middleware! */
	render: ResRender;
}
