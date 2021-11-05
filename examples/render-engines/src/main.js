import { Coggers, renderEngine } from "coggers";
import * as poggies from "poggies";
const viewsDirectory = new URL("../views", import.meta.url);

const coggers = new Coggers({
	// Poggies files end with ".pog", so "pog" here       ⬇️
	$: [renderEngine(poggies.renderFile, viewsDirectory, "pog")],
	$get(req, res) {
		res.render("index", {
			titleText: "Render engine example",
		});
	},
});

coggers
	.listen(8080)
	.then(() => console.log("Listening! Try it out, http://localhost:8080/"));
