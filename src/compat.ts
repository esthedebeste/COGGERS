import { Middleware } from "./utils";

type Express = (req, res, next) => unknown;

/** Turns express handlers into Coggers handlers. */
export const express = (...handlers: Express[]): Middleware[] =>
	handlers.map(
		handler => (req, res, params) =>
			new Promise(next => {
				req.params = params;
				handler(req, res, next);
			})
	);
