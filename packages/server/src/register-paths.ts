import path from "path";
import { register } from "tsconfig-paths";

// TS 7 tsconfig omits baseUrl; tsconfig-paths still needs one at runtime.
const projectRoot = path.resolve(__dirname, "..");

register({
  baseUrl: projectRoot,
  paths: {
    "src/*": ["src/*"],
    "@common/*": ["src/common/*"],
    "@middlewares/*": ["src/middlewares/*"],
    "@models/*": ["src/models/*"],
    "@modules/*": ["src/modules/*"],
    "@service/*": ["src/service/*"],
  },
});
