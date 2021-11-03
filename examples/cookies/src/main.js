import { Coggers } from "coggers";
const coggers = new Coggers({
	$get(req, res, params) {
		const count = parseInt(req.cookies.count);
		// First time
		if (isNaN(count)) {
			res.cookie("count", 1).send("Refresh!");
		} else {
			res.cookie("count", count + 1);
			res.send(`You've refreshed ${count} time(s)!`);
		}
	},
});

coggers
	.listen(8080)
	.then(() => console.log("Listening! Try it out, http://localhost:8080/"));
