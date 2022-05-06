
# Client

## Information
The frontend of the InkVisitor is written in TypeScript, plus several other packages, mainly:
 - [React](https://reactjs.org) for creating components
 - [Redux toolkit](https://redux-toolkit.js.org) for handling global state
 - [Styled components](https://styled-components.com) for making things nicer (as a replacement of S/CSS)
 - [Webpack](https://webpack.js.org) for bundling  

## Develop

Package uses different environments - each of them has dedicated `.env.<env>` and `webpack.<env>.js` file coupled with `npm run build-<env>` task.
Development environment has also `npm run start` script.

Example - to build staging build:

- (`npm install`)
- `npm run build-staging`

## Deploy

1. Build the frontend app by `npm run build` to create/update the `dist` folder 
2. Use provided script in root directory `./deploy-frontend-<env>.sh`. This script will simply copy the `dist` directory to target.

## Storybook

We use storybook for the development of some core components. At this moment, storybook also serve as a testing environment. To start the storybook interface, run - `npm run storybook`
