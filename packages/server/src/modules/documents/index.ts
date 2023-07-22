import {
  IDocument,
  IResponseDocument,
  IResponseDocumentDetail,
  IResponseGeneric,
} from "@shared/types";
import {
  BadParams,
  DocumentDoesNotExist,
  InternalServerError,
  ModelNotValidError,
  PermissionDeniedError,
} from "@shared/types/errors";
import { Router } from "express";
import { asyncRouteHandler } from "../index";
import { mergeDeep } from "@common/functions";
import { IRequest } from "src/custom_typings/request";
import Document from "@models/document/document";
import ResponseDocument from "@models/document/response";
import { IRequestDocument, IRequestDocuments } from "@shared/types/document";

export default Router()
  /**
   * @openapi
   * /documents/:
   *   get:
   *     description: Returns list of filtered documents entries
   *     tags:
   *       - documents
   *     parameters:
   *       - in: query
   *         name: search params
   *         schema:
   *           $ref: "#/components/schemas/IRequestDocuments"
   *         required: true
   *         description: search options for the query
   *         style: form
   *         explode: true
   *     responses:
   *       200:
   *         description: Returns list of documents entries
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/IResponseDocumentDetail"
   */
  .get(
    "/",
    asyncRouteHandler<IResponseDocumentDetail[]>(
      async (request: IRequestDocuments) => {
        const docs = await Document.getAll(
          request.db.connection,
          typeof request.query.ids === "string"
            ? (request.query.ids as string).split(",")
            : request.query.ids
        );
        return docs.map((d) => new ResponseDocument(d));
      }
    )
  )
  /**
   * @openapi
   * /documents/{documentId}:
   *   put:
   *     description: Retrieves an existing document entry
   *     tags:
   *       - documents
   *     parameters:
   *       - in: path
   *         name: documentId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the document entry
   *     requestBody:
   *       description: Document object
   *       content:
   *         application/json:
   *           schema:
   *             allOf:
   *               - $ref: "#/components/schemas/IDocument"
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseDocumentDetail"
   */
  .get(
    "/:documentId?",
    asyncRouteHandler<IResponseDocumentDetail>(
      async (request: IRequestDocument) => {
        const id = request.params.documentId;

        if (!id) {
          throw new BadParams("document id has to be set");
        }

        const existing = await Document.findDocumentById(
          request.db.connection,
          id
        );

        if (!existing) {
          throw DocumentDoesNotExist.forId(id);
        }

        return new ResponseDocument(existing);
      }
    )
  )
  /**
   * @openapi
   * /documents/:
   *   post:
   *     description: Create a new entity entry
   *     tags:
   *       - entities
   *     requestBody:
   *       description: Entity object
   *       content:
   *         application/json:
   *           schema:
   *             allOf:
   *               - $ref: "#/components/schemas/IEntity"
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
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const model = new Document(request.body as Record<string, unknown>);

      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      if (!model.canBeCreatedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("document cannot be created");
      }

      await request.db.lock();

      const saved = await model.save(request.db.connection);
      if (!saved) {
        throw new InternalServerError("cannot create document");
      }

      const out: IResponseGeneric = { result: true };

      return out;
    })
  )
  /**
   * @openapi
   * /documents/{documentId}:
   *   put:
   *     description: Update an existing document entry
   *     tags:
   *       - documents
   *     parameters:
   *       - in: path
   *         name: documentId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the document entry
   *     requestBody:
   *       description: Document object
   *       content:
   *         application/json:
   *           schema:
   *             allOf:
   *               - $ref: "#/components/schemas/IDocument"
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .put(
    "/:documentId",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const documentId = request.params.documentId;
      const documentData = request.body as Record<string, unknown>;

      // not validation, just required data for this operation
      if (
        !documentId ||
        !documentData ||
        Object.keys(documentData).length === 0
      ) {
        throw new BadParams("document id and data have to be set");
      }

      await request.db.lock();

      // documentId must be already in the db
      const existingDocument = await Document.findDocumentById(
        request.db.connection,
        documentId
      );
      if (!existingDocument) {
        throw DocumentDoesNotExist.forId(documentId);
      }

      // get correct IDbModel implementation
      const model = new Document({
        ...mergeDeep(existingDocument, documentData),
        id: documentId,
      });

      // checking the validity of the final model (already has updated data)
      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      if (!model.canBeEditedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("document cannot be saved");
      }

      // update only the required fields
      const result = await model.update(request.db.connection, documentData);

      if (result.replaced || result.unchanged) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update document ${documentId}`);
      }
    })
  )
  /**
   * @openapi
   * /documents/{documentId}:
   *   delete:
   *     description: Delete a document entry
   *     tags:
   *       - documents
   *     parameters:
   *       - in: path
   *         name: documentId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the document entry
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .delete(
    "/:documentId",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const id = request.params.documentId;
      if (!id) {
        throw new BadParams("document id has to be set");
      }

      await request.db.lock();

      const existing = await Document.findDocumentById(
        request.db.connection,
        id
      );
      if (!existing) {
        throw DocumentDoesNotExist.forId(id);
      }

      if (!existing.canBeDeletedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError(
          "document cannot be deleted by current user"
        );
      }

      const result = await existing.delete(request.db.connection);

      if (result.deleted === 1) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot delete document ${id}`);
      }
    })
  );
