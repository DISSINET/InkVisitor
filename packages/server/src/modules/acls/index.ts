import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import {
  BadParams,
  ModelNotValidError,
  InternalServerError,
  PermissionDoesNotExits,
} from "@shared/types/errors";
import { IResponseGeneric, IResponsePermission } from "@shared/types";
import AclPermission from "@models/acl/acl_permission";

export default Router()
  .get(
    "/",
    asyncRouteHandler<IResponsePermission[]>(async (request: Request) => {
      const permissionsData = await AclPermission.fetchAll(
        request.db.connection
      );
      return permissionsData;
    })
  )
  .put(
    "/:permissionId",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const permissionId = request.params.permissionId;
      const permissionData = request.body as Record<string, unknown>;

      // not validation, just required data for this operation
      if (
        !permissionId ||
        !permissionData ||
        Object.keys(permissionData).length === 0
      ) {
        throw new BadParams("permission id and data have to be set");
      }

      // permissionId must be already in the db
      const existingPermission = await AclPermission.findById(
        request.db.connection,
        permissionId
      );
      if (!existingPermission) {
        throw new PermissionDoesNotExits(
          `permission with id ${permissionId} does not exist`,
          permissionId
        );
      }

      if (!existingPermission.isValid()) {
        throw new ModelNotValidError("");
      }

      // update only the required fields
      const result = await existingPermission.update(
        request.db.connection,
        permissionData
      );

      if (result.replaced) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(
          `cannot update permission ${permissionId}`
        );
      }
    })
  )
  .delete(
    "/:permissionId",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const permissionId = request.params.permissionId;

      if (!permissionId) {
        throw new BadParams("permission id has to be set");
      }

      // permissionId must be already in the db
      const existingPermission = await AclPermission.findById(
        request.db.connection,
        permissionId
      );
      if (!existingPermission) {
        throw new PermissionDoesNotExits(
          `permission with id ${permissionId} does not exist`,
          permissionId
        );
      }

      const result = await existingPermission.delete(request.db.connection);

      if (result.deleted === 1) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(
          `cannot delete permission ${permissionId}`
        );
      }
    })
  );
