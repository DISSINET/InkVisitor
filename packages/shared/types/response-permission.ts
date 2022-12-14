import { HttpMethods } from "@shared/enums";

export interface IResponsePermission {
  id: string;
  controller: string;
  route: string;
  method: HttpMethods;
  roles: string[];
  public: boolean;
}
