import { UserEnums } from "./../enums";

export class RequestPermissionUpdate {
  controller?: string;
  method?: string;
  roles?: UserEnums.Role[];
}
