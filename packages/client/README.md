# Client

Package uses different environments - each of them has dedicated `.env.<env>` and `webpack.<env>.js` file coupled with `npm run build-<env>` task.
Development environment has also `npm run start` script.

Example - to build staging build:

- (`npm install`)
- `npm run build-staging`

## Deploy

1. Build the frontend app.
2. Use provided script in root directory `./deploy-frontend-<env>.sh`. This script will simply copy the `dist` directory to target.

## Storybook

- (`npm install`)
- `npm run storybook`
