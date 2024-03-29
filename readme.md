<div align="center"><img alt="COGGERS" height="120" src="./tests/assets/coggers.gif"></div>

# Coggers

Coggers is a object-based web server, boasting amazing modularity.

### Blueprints

Coggers uses "blueprints" to define what a server should look like.

For example, where in express you'd use

```js
import express from "express";
const app = express();
app.get("/users/:id/", (req, res) => {
	const user = database.getUser(params.id);
	res.send(user);
});
app.post("/users/:id/", (req, res) => {
	const user = database.createUser(params.id);
	res.send(user);
});
app.listen(8080, () => console.log("Listening!"));
```

in Coggers you instead use

```js
import { Coggers } from "coggers";
const coggers = new Coggers({
	users: {
		":id": {
			$get(req, res, params) {
				const user = database.getUser(params.id);
				res.send(user);
			},
			$post(req, res, params) {
				const user = database.createUser(params.id);
				res.send(user);
			},
		},
	},
});
coggers.listen(8080).then(() => console.log("Listening!"));
```

### Middleware

In Coggers, middleware does _not_ have a next() function. [More info](#middleware-note)

Anyhow, to add middleware you can use the `$` key, with an array of middlewares.

<details>
	<summary>Note</summary>
	<small>
		Coggers comes with cookie-parsing built in, so the cookie-parser middleware isn't necessary. This is just to show an example of how you can define middleware.
	</small>
</details><br>

```js
import { express } from "coggers/compat";
import cookieParser from "cookie-parser";
const coggers = new Coggers({
	// express() turns express-based middleware into coggers middleware.
	$: [express(cookieParser())],
	$get(req, res, params) {
		const user = database.getUser(req.cookies.id);
		res.send(user);
	},
	$post(req, res, params) {
		const user = database.createUser(req.cookies.id);
		res.send(user);
	},
});
```

### Modularity

As Coggers is fully object-based, modularity is simpler than ever. All you need to do is export a part of a blueprint from file A, and then you can import that in file B and simply put it right in.

[Example](./examples/modularity)

### Intellisense

Because of this modularity, it's likely that there's blueprints that aren't passed directly into the Coggers constructor. (In the last example, the variable `users`.)

For your IDE to be able to autocomplete blueprints, you can use the `blueprint()` utility function. (don't worry, it won't do anything with your blueprint!)

```js
import { blueprint } from "coggers";
const blue = blueprint({
	// Woah, intellisense
});
```

In typescript, you can also annotate your variable with the `Blueprint` type:

```ts
import { Blueprint } from "coggers";
const blue: Blueprint = {
	// Woah, intellisense
};
```

### Render Engines

Render engines are defined using the renderEngine middleware. [Full example here](./examples/render-engines)

```js
import { Coggers, renderEngine } from "coggers";
import { renderFile } from "poggies";
const viewsDirectory = new URL("views", import.meta.url);
const coggers = new Coggers({
	// Poggies files end with ".pog", so "pog" here ⬇️
	$: [renderEngine(renderFile, viewsDirectory, "pog")],
	$get(req, res) {
		res.render("index", {
			random: Math.random(),
		});
	},
});
```

##### Middleware note

Asynchronous middleware is expected to either be defined as an async function, or to return a promise. If a middleware doesn't want to continue to the next handler, it has to send something to the client (using `res.sendStatus(<number>)`, `res.end()`, etc.)
