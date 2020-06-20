# CLIENT

### Redux dev tools

- if you want to use redux in dev mode, with browser addOn "Redux DevTools"
- go to: <code>store.tsx</code>
- add: <code>import { composeWithDevTools } from "redux-devtools-extension";</code>
- change: <code>compose(applyMiddleware(...middleWare))</code> to <code>composeWithDevTools(applyMiddleware(...middleWare))</code>
