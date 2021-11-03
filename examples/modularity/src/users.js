let users = {
	foo: `User with ID foo, ${Math.random().toFixed(3)}`,
};
export const users = {
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
};
