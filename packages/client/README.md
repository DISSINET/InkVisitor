# CLIENT

### Redux dev tools

- if you want to use redux in dev mode, with browser addOn "Redux DevTools"
- go to: <code>store.tsx</code>
- add: <code>import { composeWithDevTools } from "redux-devtools-extension";</code>
- change: <code>compose(applyMiddleware(...middleWare))</code> to <code>composeWithDevTools(applyMiddleware(...middleWare))</code>

### API

Endpoints:

**meta**

- get all information that are needed before the application is loaded
  - all actions
  - all dictionaries

**territory/:territoryId**

- get the required territory by the given territory id plus:
  - its parent, and children territories
  - statements under this territory
  - all actants used within these statements

**actant?<filters>**

- return all actants passing given filters and (optionally) information about their use:
  - statements in which this actant was used
  - territories in which this actant was used
