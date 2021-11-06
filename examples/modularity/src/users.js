import { blueprint } from "coggers";
let users = {
	foo: `User with ID foo, ${Math.random().toFixed(3)}`,
};

// The blueprint() function lets VS Code tell you
//   which methods are available on req and res.
export const users = blueprint({
	// $$id is the same as :id
	$$id: {
		$get(req, res, { id }) {
			const user = users[id];
			res.send(user);
		},
		$post(req, res, { id }) {
			users[id] = `User with ID ${id}, ${Math.random().toFixed(3)}`;
			res.send(user);
		},
	},
});
