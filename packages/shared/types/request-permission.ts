import { userRoleDict } from "./../dictionaries";

const userRoleValues = userRoleDict.map((i) => i.label);

export class RequestPermissionUpdate {
  controller?: string;
  method?: string;
  roles?: typeof userRoleValues;
}
