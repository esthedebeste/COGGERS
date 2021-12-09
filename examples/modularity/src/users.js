import { blueprint } from "coggers";
const db = {
	foo: `User with ID foo, ${Math.random().toFixed(3)}`,
};

// The blueprint() function lets VS Code tell you
//   which methods are available on req and res.
export const users = blueprint({
	// $$id is the same as :id
	$$id: {
		$get(req, res, { id }) {
			const user = db[id];
			res.send(user);
		},
		$post(req, res, { id }) {
			const user = `User with ID ${id}, ${Math.random().toFixed(3)}`;
			db[id] = user;
			res.send(user);
		},
	},
});
