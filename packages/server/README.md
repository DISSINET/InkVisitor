# Server package

The application located in /packages/server is the api for inkVisitor project.
It uses express + express router as a base.

Server supports different enviroments - supported by `.env-<env>` files and appropriade `yarn` scripts.
Production build expects environment variables to be passed in container context, but you can override this by setting variable `ENV_FILE`.

### Env variables

See [example.env](./env/example.env) file for description of variables.

## Development

You should normally use `development` environment - run in nodemon context for livereload.

1. `yarn`
2. `yarn run start:development`

## Test

- `yarn run test` will use `jest` framework to test everything, or
- `yarn run test <regexp>` to test only selected functions (regexp should match `describe` or `it` statements)

## Build & run

Build transpiles typescript files to javascript.

1. `yarn run build`
2. `ENV_FILE=<env> yarn run start` to run the built application with loaded `.env.<env>` file.

Make sure to have appropriate `.env.<env>` file accessible.

## API docs

### Postman

Please refer to exported [postman collection](./postman/inkvisitor_api.postman_collection.json) file to explore the api and available endpoints.

### Swagger

- generate swagger file wihch `yarn swagger`. A `swagger.json` file will be generated in server directory
- provide path to this file in `.env` file using `SWAGGER_FILE` env variable
- start the server ie. `yarn start:development`
- visit `http://localhost:3000/api-docs` (or otherwise configured host/port)

## Authorization

Api uses JWT tokens to authenticate the user. With this the session is controlled by token which makes the development faster, makes api easier for testing but exposes several problems, mainly token expiration question and/or session invalidation. As mentioned avove, the jwt should be replaced by cookie session in the future. Token based authorization, hovewer, should still be available.

Utility script for generating new jwt tokens:

`yarn run jwt`

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
