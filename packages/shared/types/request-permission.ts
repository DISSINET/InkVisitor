import { UserRole } from "./../enums";

export class RequestPermissionUpdate {
  controller?: string;
  method?: string;
  roles?: UserRole[];
}
