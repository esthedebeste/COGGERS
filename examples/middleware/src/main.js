import { Coggers } from "coggers";
const coggers = new Coggers({
	$: [
		(req, res) => {
			if (Math.random() < 0.5) {
				res.send("Sent from middleware!");
			}
		},
	],
	$get(req, res) {
		res.send("Sent from the $get handler!");
	},
});

coggers
	.listen(8080)
	.then(() => console.log("Listening! Try it out, http://localhost:8080/"));
