import { Coggers } from "coggers";
// Note the import "./users.js", the .js extension is needed for typescript to correctly export your code to ESM
// For convenience, this example has a .vscode folder which defines a setting that will automatically add the .js extension to the import
import { users } from "./users.js";
const coggers = new Coggers({
	users,
});

coggers
	.listen(8080)
	.then(() =>
		console.log("Listening! Try it out, http://localhost:8080/users/foo/")
	);
