import { UserRoles } from "./../enums";

export class RequestPermissionUpdate {
  controller?: string;
  method?: string;
  roles?: UserRoles;
}
