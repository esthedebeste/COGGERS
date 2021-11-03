import { Coggers } from "coggers";
const coggers = new Coggers({
	users: {
		":id": {
			$get(req, res, params) {
				res.send(`Hey, user ${params.id}`);
			},
		},
	},
});

coggers
	.listen(8080)
	.then(() =>
		console.log("Listening! Try it out, http://localhost:8080/users/foo")
	);
