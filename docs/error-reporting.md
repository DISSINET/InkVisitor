# Error reporting

Error toasts offer **Copy details** when the server failed in a way only its log
explains: a 5xx our server sent, an error code the client doesn't know, a
response without an error code that isn't a proxy page, or a client bug. The
rules are in `packages/client/src/utils/requestError.ts` and its tests; the
wording is in `packages/shared/types/errors.ts`.

The copied text holds the time, request id, request, status, error code, message
and page URL. The client sends the id in the `x-inkvisitor-request-id` header,
and the server logs it next to the error:

```
[Unhandled error] [request b65aea4d-7b89-4309-acd0-ef625ea71093] <message and stack trace>
```

To find a reported error, search the API server's output for the id. The server
logs only unhandled errors and errors marked `loggable`; for the rest, the
copied text is the whole record.
