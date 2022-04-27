# Server package

The application located in /packages/server is the api for inkVisitor project.
It uses express + express router as a base.

## TBD

Current development will target (next to new features) the following:

- adhere to REST conventions
- increase test coverage
- add swagger api doc
- switch to cookie based authentication, keep jwt for api access

## Postman

Please refer to exported [postman collection](./postman/inkvisitor_api.postman_collection.json) file to explore the api and available endpoints.

## Security

Api uses JWT tokens to authenticate the user. With this the session is controlled by token which makes the development faster, makes api easier for testing but exposes several problems, mainly token expiration question and/or session invalidation. As mentioned avove, the jwt should be replaced by cookie session in the future. Token based authorization, hovewer, should still be available.

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
