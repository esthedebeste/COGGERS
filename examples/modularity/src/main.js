import { Coggers } from "coggers";
import { users } from "./users.js";
const coggers = new Coggers({
	users,
});

coggers
	.listen(8080)
	.then(() =>
		console.log("Listening! Try it out, http://localhost:8080/users/foo/")
	);
