# Client

## Information

The frontend of the InkVisitor is written in TypeScript, plus several other packages, mainly:

- [React](https://reactjs.org) for creating components
- [Redux toolkit](https://redux-toolkit.js.org) for handling global state
- [Styled components](https://styled-components.com) for making things nicer (as a replacement of S/CSS)
- [Webpack](https://webpack.js.org) for bundling

Package uses different environments - each of them has dedicated `.env.<env>` and `webpack.<env>.js` file coupled with `npm run build-<env>` task.
Development environment has also `npm run start` script.

### Env variables

See [example.env](./env/example.env) file for description of variables.

## Development

1. `npm install`
2. `npm start`

## Deploy

Frontend are just static files - html/css/js + additional assets. These can be fetched by any http server.

### Standalone

1. Build the frontend app by `npm run build-<env>` to create/update the `dist` folder
2. Copy contents of `dist` folder to directory used by your http server.

### Docker

To keep it simple, we are using just one container holding both frontend and backend. Please see the main [README.md](../../README.md) in the root.

## Storybook

We use storybook for the development of some core components. At this moment, storybook also serve as a testing environment. To start the storybook interface, run - `npm run storybook`
