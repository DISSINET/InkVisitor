import { IResponseGeneric } from "@shared/types";
import {
  BadParams,
  InternalServerError,
  ModelNotValidError,
  PermissionDeniedError,
  RelationDoesNotExist,
} from "@shared/types/errors";
import Relation from "@models/relation/relation";
import { Request, Router } from "express";
import { asyncRouteHandler } from "../index";
import { getRelationClass } from "@models/factory";

export default Router()
  /**
   * @openapi
   * /relations/:
   *   post:
   *     description: Create a new relation entry
   *     tags:
   *       - relations
   *     requestBody:
   *       description: Relation object
   *       content: 
   *         application/json:
   *           schema:
   *             allOf:
   *               - $ref: "#/components/schemas/RelationIModel"               
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .post(
    "/",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      await request.db.lock();

      const model = getRelationClass(request.body);

      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      if (!model.canBeCreatedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("entity cannot be created");
      }

      const result = await model.save(request.db.connection);

      if (
        result.first_error &&
        result.first_error.indexOf("Duplicate") !== -1
      ) {
        throw new ModelNotValidError("id already exists");
      }

      if (result.inserted === 1) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot create relation`);
      }
    })
  )
  /**
   * @openapi
   * /relations/{relationId}:
   *   put:
   *     description: Update an existing relation entry
   *     tags:
   *       - relations
   *     parameters:
   *       - in: path
   *         name: relationId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the relation entry
   *     requestBody:
   *       description: Relation object
   *       content: 
   *         application/json:
   *           schema:
   *             allOf:
   *               - $ref: "#/components/schemas/RelationIModel"               
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .put(
    "/:relationId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const id = request.params.relationId;
      const data = request.body as Record<string, unknown>;

      if (!id || !data || Object.keys(data).length === 0) {
        throw new BadParams("relation id and data have to be set");
      }

      const existing = await Relation.getById(request, id);
      if (!existing) {
        throw RelationDoesNotExist.forId(id);
      }

      const model = new Relation({ ...existing, ...data });
      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      if (!model.canBeEditedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("relation cannot be saved");
      }

      const result = await model.update(request.db.connection, data);

      if (result.replaced || result.unchanged) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update relation ${id}`);
      }
    })
  )
  /**
   * @openapi
   * /relations/{relationId}:
   *   delete:
   *     description: Delete a relation entry
   *     tags:
   *       - relations
   *     parameters:
   *       - in: path
   *         name: relationId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the relation entry             
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .delete(
    "/:relationId",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const id = request.params.relationId;

      if (!id) {
        throw new BadParams("relation id has to be set");
      }

      const existing = await Relation.getById(request, id);
      if (!existing) {
        throw RelationDoesNotExist.forId(id);
      }

      if (!existing.canBeDeletedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError(
          "relation cannot be deleted by current user"
        );
      }

      const result = await existing.delete(request.db.connection);

      if (result.deleted === 1) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot delete relation ${id}`);
      }
    })
  );
