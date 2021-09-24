import { Middleware } from "./types";

/** Turns an express middleware into a Coggers middleware. */
export const express =
	(handler: (req, res, next) => unknown): Middleware =>
		(req, res, params) =>
			new Promise(next => {
				req.params = params;
				handler(req, res, next);
			});
