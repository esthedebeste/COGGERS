import { Coggers } from "coggers";
const coggers = new Coggers({
	users: {
		$$id: {
			$get(req, res, { id }) {
				req.format({
					html: () => res.send(`<h1>Hi, user ${id}!</h1>`),
					json: () => res.json({ text: `Hi, user ${id}!` }),
					xml: () => res.type("xml").send(`<greeting to="${id}" />`),
					txt: () => res.type("txt").send(`Hi, user ${id}!`),
					default: () => res.send("Hi?"),
				});
			},
		},
	},
});

coggers
	.listen(8080)
	.then(() =>
		console.log("Listening! Try it out, http://localhost:8080/users/foo")
	);
