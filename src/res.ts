import { lookup, mime } from "filename2mime";
import { createHash } from "node:crypto";
import { PathLike, readFileSync } from "node:fs";
import { ServerResponse } from "node:http";
import * as cookie from "./cookie";
import { ResRender } from "./extensions/render";
import { Request } from "./req";

const weakETag = (
	data: string | Uint8Array,
	// TODO?: Make ETags more customizable?
	{ hash, size } = { hash: "sha1", size: 32 }
): string =>
	`W/"${createHash(hash).update(data).digest("base64url").slice(0, size)}"`;

export class Response extends ServerResponse {
	/** Provided by node, a reference to the Request object. */
	req: Request;

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

	/** {@link Response.end res.end} with extra etagging */
	etagEnd(data: Uint8Array | string, override = false): Promise<void> {
		let dataTag = this.headers.ETag as string;
		if (!dataTag || override) this.headers.ETag = dataTag = weakETag(data);

		// Remove W/ because If-None-Match is always weak.
		dataTag = dataTag.replace(/^W\//, "");

		if (this.req.headers["if-none-match"])
			for (const etag of this.req.headers["if-none-match"].match(/"[^"]*"/g))
				if (etag === dataTag)
					return new Promise(callback => this.status(304).end(callback));

		return new Promise(callback => this.end(data, callback));
	}

	status(code: number, message?: string): this {
		this.statusCode = code;
		if (message) this.statusMessage = message;
		return this;
	}

	sendStatus(code: number, message?: string): void {
		this.status(code, message).end();
	}

	json(data: unknown): void {
		this.headers["Content-Type"] ??= "application/json; charset=UTF-8";
		this.etagEnd(JSON.stringify(data));
	}

	html(data: string): void {
		this.headers["Content-Type"] ??= "text/html; charset=UTF-8";
		this.etagEnd(data);
	}

	send(data: unknown): void {
		if (data instanceof Uint8Array) {
			this.headers["Content-Type"] ??= "application/octet-stream";
			this.etagEnd(data);
		} else if (typeof data === "string") this.html(data);
		else if (data == null) this.end();
		else this.json(data);
	}

	sendFile(file: PathLike): void {
		this.headers["Content-Disposition"] = "inline";
		this.headers["Content-Type"] ??= lookup(file.toString());
		// TODO: Make this work with streams again.
		const data = readFileSync(file);
		this.etagEnd(data);
	}

	/**
	 * Will prompt the browser for a "Save-As" screen.
	 * @param as The name of the file the browser will save
	 */
	download(file: PathLike, as: string): void {
		this.headers["Content-Disposition"] = `attachment; filename=${as}`;
		this.headers["Content-Type"] ??= lookup(as);
		this.etagEnd(readFileSync(file));
	}

	set(headers: Record<string, string | number | string[]>): this;
	set(header: string, value: string | number | string[]): this;
	set(
		header: string | Record<string, string | number | string[]>,
		value?: string | number | string[]
	): this {
		if (typeof header === "object")
			for (const key in header) this.headers[key] = header[key];
		else this.headers[header] = value;
		return this;
	}

	redirect(url: string, status = 302): void {
		this.status(status).setHeader("Location", url).end();
	}

	type(type: string): this {
		if (type.includes("/")) this.headers["Content-Type"] = type;
		else if (mime[type]) this.headers["Content-Type"] = mime[type];
		return this;
	}

	cookie(name: string, value: string, options: cookie.Options = {}): this {
		const newCookie = cookie.serialize(name, value, options);
		const cookies = this.headers["Set-Cookie"] as null | string[];
		if (cookies == null) this.headers["Set-Cookie"] = [newCookie];
		else cookies.push(newCookie);
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
