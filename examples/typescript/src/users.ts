import { Blueprint } from "coggers";
const db: Record<string, string> = {
	foo: `User with ID foo, ${Math.random().toFixed(3)}`,
};

// Note the use of the `Blueprint` type instead of the function used in JS.
export const users: Blueprint = {
	$$id: {
		$get(_req, res, { id }) {
			const user = db[id];
			res.send(user);
		},
		$post(_req, res, { id }) {
			const user = `User with ID ${id}, ${Math.random().toFixed(3)}`;
			db[id] = user;
			res.send(user);
		},
	},
};
