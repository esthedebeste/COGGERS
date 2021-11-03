You can self-sign localhost HTTPS keys with this command:

```sh
openssl req -x509 -nodes -new -sha256 -newkey rsa:2048 -keyout key.pem -out cert.pem -subj /
```

This example comes with a couple included though, just for convenience.
