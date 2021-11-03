export function parse(cookie: string): Record<string, string> {
	const cookies: Record<string, string> = {};
	for (const kv of cookie.split(";")) {
		const middle = kv.indexOf("=");
		if (middle === -1) continue;

		const key = kv.slice(0, middle).trim();
		let value = kv.slice(middle + 1, kv.length).trim();
		if (value.startsWith('"') && value.endsWith('"'))
			value = value.slice(1, -1);

		// First cookie is NOT overriden by later cookies with the same name.
		if (cookies[key] == null) cookies[key] = decodeURIComponent(value);
	}
	return cookies;
}

export type Options = {
	maxAge?: number;
	domain?: string;
	path?: string;
	sameSite?: "Strict" | "Lax" | "None";
	expires?: Date;
	httpOnly?: boolean;
	secure?: boolean;
};

export function serialize(
	name: string,
	value: string,
	{ maxAge, domain, path, expires, httpOnly, secure, sameSite }: Options
): string {
	let cookie = name + "=" + encodeURIComponent(value);

	if (maxAge != null) cookie += "; Max-Age=" + Math.floor(maxAge);
	// Max-Age always overrides Expires.
	else if (expires) cookie += "; Expires=" + expires.toUTCString();
	if (domain) cookie += "; Domain=" + domain;
	if (path) cookie += "; Path=" + path;
	if (sameSite) cookie += "; SameSite=" + sameSite;
	if (httpOnly) cookie += "; HttpOnly";
	if (secure) cookie += "; Secure";

	return cookie;
}
