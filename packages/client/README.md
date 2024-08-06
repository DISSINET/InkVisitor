# Client

## Information

The frontend of the InkVisitor is written in TypeScript, plus several other packages, mainly:

- [React](https://reactjs.org) for creating components
- [Redux toolkit](https://redux-toolkit.js.org) for handling global state
- [Styled components](https://styled-components.com) for making things nicer (as a replacement of S/CSS)
- [Webpack](https://webpack.js.org) for bundling

Package uses different environments - each of them has dedicated `.env.<env>` file coupled with `pnpm build-<env>` task. Development environment has also `pnpm start` script.

### Env variables

See [example.env](./env/example.env) file for description of variables.

## Development

1. `pnpm install`
2. `pnpm start`

## Deploy

Frontend are just static files - html/css/js + additional assets. These can be fetched by any http server.

### Standalone

1. Build the frontend app by `pnpm build:<env>` to create/update the `dist` folder
2. Copy contents of `dist` folder to directory used by your http server.

### Docker

To keep it simple, we are using just one container holding both frontend and backend. Please see the main [README.md](../../README.md) in the root.
