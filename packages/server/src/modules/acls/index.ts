import { asyncRouteHandler } from "../index";
import { Router } from "express";
import {
  BadParams,
  ModelNotValidError,
  InternalServerError,
  PermissionDoesNotExits,
} from "@shared/types/errors";
import { IResponseGeneric, IResponsePermission } from "@shared/types";
import AclPermission from "@models/acl/acl_permission";
import { IRequest } from "src/custom_typings/request";

export default Router()
  /**
   * @openapi
   * /acls/:
   *   get:
   *     description: Returns list of all acl entries
   *     tags:
   *       - acls
   *     responses:
   *       200:
   *         description: Returns list of acl entries
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items: 
   *                 $ref: "#/components/schemas/IResponseGeneric"
   */
  .get(
    "/",
    asyncRouteHandler<IResponsePermission[]>(async (request: IRequest) => {
      const permissionsData = await AclPermission.fetchAll(
        request.db.connection
      );
      return permissionsData;
    })
  )
  /**
   * @openapi
   * /acls/{permissionId}:
   *   put:
   *     description: Update an existing acl entry
   *     tags:
   *       - acls
   *     parameters:
   *       - in: path
   *         name: permissionId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the acl entry
   *     requestBody:
   *       description: Acl object
   *       content: 
   *         application/json:
   *           schema:
   *             allOf:
   *               - $ref: "#/components/schemas/Acl"               
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .put(
    "/:permissionId",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
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
  /**
   * @openapi
   * /acls/{permissionId}:
   *   delete:
   *     description: Delete an acl entry
   *     tags:
   *       - acls
   *     parameters:
   *       - in: path
   *         name: permissionId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the acl entry             
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .delete(
    "/:permissionId",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
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
