# Server package

The application located in /packages/server is the api for inkVisitor project.
It uses express + express router as a base.

Server supports different enviroments - supported by `.env-<ENV_FILE>` files, which are governed by `ENV_FILE` environmental variable.

### Env variables

See [example.env](./env/example.env) file for description of variables.

## Development

You would normally use default `development` environment - run in nodemon context for livereload using default `start` command for consistency across packages.

1. `pnpm install`
2. `pnpm start`

## Test

- create a new `.env.test` file in the `env` folder that
- `pnpm test` will use `jest` framework to test everything, or
- `pnpm run test <regexp>` to test only selected functions (regexp should match `describe` or `it` statements)
- if you are using Visual Studio Code, we recommend installing `Jest Runner` extension

## Build & run

The `build` process transpiles typescript files to javascript.

1. `pnpm build`
2. `ENV_FILE=<env> pnpm start:dist` to run the built application with loaded `.env.<ENV_FILE>` file.

Make sure to have appropriate `.env.<ENV_FILE>` file accessible (e.g., running `ENV_FILE=production pnpm start:dist` will need `env.production`). You can use the `example.env` file as a template for creating your own `env` file, just check and modify the values here if needed:

- `NODE_ENV` =
- `DOMAIN` =
- `STATIC_PATH` =
- `SWAGGER_FILE` =
- `PORT` =
- `SECRET` =
- `NODEMAILER_API_KEY` =
- `MAILER_SENDER` =
- `PYTHON_API_HOST` =

## API docs

### Postman

Please refer to exported [postman collection](./postman/inkvisitor_api.postman_collection.json) file to explore the api and available endpoints.

## Authorization

Api uses JWT tokens to authenticate the user. With this the session is controlled by token which makes the development faster, makes api easier for testing but exposes several problems, mainly token expiration question and/or session invalidation. As mentioned avove, the jwt should be replaced by cookie session in the future. Token based authorization, hovewer, should still be available.

Utility script for generating new jwt tokens:

`pnpm run jwt`

## Errors

Server has one handler for unknown routes (wildcard - when the route does not exist) and one generic handler for other errors.
They share common `IResponseGeneric` (@shared/types/response-generic.ts) interface which is populated by `CustomError` instance (@shared/types/errors.ts).

Example of erroneous `IResponseGeneric` msg:

```
{
    result: false,
    error: "ActionDoesNotExits",
    message: "action with id 2 does not exist"
}
```

The output above is generated from thrown error like:

```
throw new ActionDoesNotExits(`action with id ${actionId} does not exist)
```

What happens in the error handler (middleware) is that the error is transformed to `IResponseGeneric` by taking values

```
error <= thrownError.constructor.name
message <= thrownError.message
```

`CustomError` respects the generic Error class logic for constructor parameter (message) and using the custom error's name as `name` property
and new static property `code`, which will be used as http status code in the api response.

```
const err = new ActionDoesNotExits(`action with id ${actionId} does not exist)
err.name === "ActionDoesNotExits"
err.statusCode() === 400 | 404 | 500 etc
```

### Handling unexpected errors

Its possible, that the server would encounter an unexpected error, ie. corrupt db handler.
The generic error handler then takes the error instance and will use prepared `InternalServerError` substitution.
While this error could be completely random, the api will return the same generic message. In the handler, however, the logger will print the original error.
