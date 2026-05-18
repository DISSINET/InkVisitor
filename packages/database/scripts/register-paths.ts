import path from "path";
import { register } from "tsconfig-paths";

const projectRoot = path.resolve(__dirname, "..");

register({
  baseUrl: projectRoot,
  paths: {
    "scripts/*": ["scripts/*"],
    "@common/*": ["../server/src/common/*"],
    "@models/*": ["../server/src/models/*"],
    "@service/*": ["../server/src/service/*"],
    "@shared/*": ["../shared/*"],
  },
});
