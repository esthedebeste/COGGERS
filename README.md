# Coggers

![COGGERS](https://cdn.betterttv.net/emote/5ab6f0ece1d6391b63498774/3x)

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
const app = new Coggers({
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
app.listen(8080).then(() => console.log("Listening!"));
```

### Middleware

In Coggers, middleware does _not_ have a next() function. [More info](#middleware-note)

Anyhow, to add middleware you can use the `$` key, with an array of middlewares.

```js
import { express } from "coggers/compat";
import cookieParser from "cookie-parser";
const app = new Coggers({
	users: {
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
	},
});
```

### Modularity

As Coggers is fully object-based, modularity is simpler than ever. All you need to do is export a part of a blueprint from file A, and then you can import that in file B and simply put it right in. For example:

```js
// users.js
export const users = {
	$get(req, res, params) {
		const user = database.getUser(params.id);
		res.send(user);
	},
	$post(req, res, params) {
		const user = database.createUser(params.id);
		res.send(user);
	},
};
```

```js
// app.js
import { users } from "./users.js";
const app = new Coggers({
	users,
});
```

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

Render engines are defined using the renderEngine middleware. Example:

```js
import { Coggers, renderEngine } from "coggers";
import { renderFile } from "poggies";
// In CommonJS, path.join(__dirname, "views")
const viewsDirectory = new URL("views", import.meta.url);
const app = new Coggers({
	// Poggies files end with ".pog", so "pog" here ⬇️
	$: [renderEngine(renderFile, viewsDirectory, "pog")],
	users: {
		$get(req, res, params) {
			const user = database.getUser(params.id);
			res.render("user", { user });
		},
	},
});
```

/views/user.pog looks like this:

```
html {
  head {
    title[>`Hi, ${user.name}`]
  }
  body {
    p[>`Hi, ${user.name}`]
  }
}
```

##### Middleware note

Asynchronous middleware is expected to either be defined as an async function, or to return a promise. If a middleware doesn't want to continue to the next handler, it has to send something to the client (using `res.sendStatus(<number>)`, `res.end()`, etc.)
