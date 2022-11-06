import { UserEnums } from "@shared/enums";

export class RequestPermissionUpdate {
  controller?: string;
  method?: string;
  roles?: UserEnums.Role[];
}
