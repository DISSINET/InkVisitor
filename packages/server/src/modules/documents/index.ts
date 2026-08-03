import { mergeDeep } from "@common/functions";
import Audit from "@models/audit/audit";
import { ResponseDocumentAudit } from "@models/audit/response";
import Document from "@models/document/document";
import { AnchorsNode } from "@models/document/anchors";
import Resource from "@models/resource/resource";
import User from "@models/user/user";
import { EntityEnums, UserEnums } from "@inkvisitor/shared/enums";
import {
  IDocument,
  IDocumentExport,
  IDocumentMeta,
  IResponseAudit,
  IResponseGeneric,
  IDocumentAuditAnchorChanges,
  AuditScope,
} from "@inkvisitor/shared/types";
import {
  BadParams,
  DocumentDoesNotExist,
  InternalServerError,
  ModelNotValidError,
  PermissionDeniedError,
} from "@inkvisitor/shared/types/errors";
import { EventType } from "@inkvisitor/shared/types/stats";
import { Router } from "express";
import { Connection, r as rethink } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import { asyncRouteHandler } from "../index";
import { filterDocumentContent } from "./export";

/**
 * Whether the user may edit/delete/export the given document. Owner/Admin
 * always can; Viewer never. An Editor may manage a document only when assigned
 * (in Manage Users) the Resource that links to it via data.documentId.
 */
async function userCanManageDocument(
  conn: Connection,
  documentId: string,
  user: User
): Promise<boolean> {
  if (user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin])) {
    return true;
  }
  if (user.role !== UserEnums.Role.Editor) {
    return false;
  }
  const resource = await Resource.findByDocumentId(conn, documentId);
  return !!resource && user.hasAnnotateRightForResource(resource.id);
}

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
   *           $ref: "#/components/schemas/IRequestDocument"
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
   *                 $ref: "#/components/schemas/IDocument"
   */
  .get(
    "/",
    asyncRouteHandler<IDocumentMeta[]>(async (request: IRequest) => {
      // Metadata-only fetch. `content` and `anchors` are dropped at the
      // DB so they never cross the wire to Node (anchors trees can run
      // into MBs per doc); the list consumers only use id / title /
      // entityIds / dates. Full content and anchor tree are served by
      // GET /documents/:id when actually needed.
      //
      // Every write path runs Document.preprocess before saving, so
      // anchors and entityIds are persisted on each row. We don't
      // recompute them on read - documents pre-dating preprocess must
      // be re-saved (any edit triggers it) to populate the fields.
      const docs = (await rethink
        .table(Document.table)
        .orderBy(rethink.asc("createdAt"))
        .without("content", "anchors")
        .run(request.db.connection)) as IDocument[];

      return docs.map((d) => {
        const document = new Document(d);
        // @ts-ignore content/anchors are part of IDocument but trimmed from the list response
        delete document.content;
        document.anchors = [];
        // Legacy compatibility: rows not re-saved since preprocess-on-write
        // (#2643) may store entityIds in an old shape (flat string[] or an
        // object missing class keys such as `T`). Dev masked this by
        // re-running preprocess on every read; we instead normalize the
        // shape here so the client never reads entityIds.T as undefined and
        // crashes. No-op for current rows; re-saving a legacy doc fixes it.
        document.entityIds = Document.normalizeEntityIds(document.entityIds);
        return document;
      });
    })
  )
  .get(
    "/:documentId/audits",
    asyncRouteHandler<IResponseAudit>(
      async (request: IRequest<{ documentId: string }, unknown, { noAudits?: string }>) => {
        const documentId = request.params.documentId;
        if (!documentId) {
          throw new BadParams("document id has to be set");
        }
        const requestedNoAudits = request.query.noAudits;
        const parsedNoAudits = requestedNoAudits
          ? Number.parseInt(requestedNoAudits, 10)
          : 5;
        const noAudits =
          Number.isFinite(parsedNoAudits) && parsedNoAudits > 0
            ? parsedNoAudits
            : 5;
        const existingDocument = await Document.getDocumentById(
          request.db.connection,
          documentId
        );
        if (!existingDocument) {
          throw DocumentDoesNotExist.forId(documentId);
        }
        const response = new ResponseDocumentAudit(documentId);
        await response.prepare(request.db.connection, noAudits);
        return response;
      }
    )
  )
  .get(
    "/:documentId",
    asyncRouteHandler<IDocument>(async (request: IRequest) => {
      const id = request.params.documentId;

      if (!id) {
        throw new BadParams("document id has to be set");
      }

      const document = await Document.getDocumentById(
        request.db.connection,
        id
      );

      if (!document) {
        throw DocumentDoesNotExist.forId(id);
      }

      await document.preprocess(request.db.connection);

      return document;
    })
  )
  .post("/export", async (request: IRequest, res: any) => {
    const id = request.body.documentId;
    const exportedEntities = request.body
      .exportedEntities as EntityEnums.Class[];

    if (!id) {
      throw new BadParams("document id has to be set");
    }

    const document = await Document.getDocumentById(request.db.connection, id);

    if (!document) {
      throw DocumentDoesNotExist.forId(id);
    }

    if (
      !(await userCanManageDocument(
        request.db.connection,
        id,
        request.getUserOrFail()
      ))
    ) {
      throw new PermissionDeniedError("document cannot be exported");
    }

    const filteredContent = filterDocumentContent(document, exportedEntities);

    res.setHeader("content-type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="export.txt"`);
    res.send(filteredContent);
  })
  /**
   * @openapi
   * /documents/export-batch:
   *   post:
   *     description: Returns the exported content of multiple documents at once
   *     tags:
   *       - documents
   *     requestBody:
   *       description: Ids of the documents and the entity classes to keep
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               documentIds:
   *                 type: array
   *                 items:
   *                   type: string
   *               exportedEntities:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Returns a list of exported documents
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/IDocumentExport"
   */
  .post("/export-batch", async (request: IRequest, res: any, next: any) => {
    try {
      const documentIds = request.body.documentIds as string[];
      const exportedEntities = request.body
        .exportedEntities as EntityEnums.Class[];

      if (!Array.isArray(documentIds) || !documentIds.length) {
        throw new BadParams("document ids have to be set");
      }

      const user = request.getUserOrFail();
      const exports: IDocumentExport[] = [];

      // a single unexportable document fails the whole batch - a partial
      // archive would silently omit documents the user asked for
      for (const documentId of documentIds) {
        const document = await Document.getDocumentById(
          request.db.connection,
          documentId
        );

        if (!document) {
          throw DocumentDoesNotExist.forId(documentId);
        }

        if (
          !(await userCanManageDocument(
            request.db.connection,
            documentId,
            user
          ))
        ) {
          throw new PermissionDeniedError("document cannot be exported");
        }

        exports.push({
          id: document.id,
          title: document.title,
          content: filterDocumentContent(document, exportedEntities),
        });
      }

      res.json(exports);
    } catch (err) {
      next(err);
    }
  })
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

      await model.preprocess(request.db.connection);
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
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest<{ documentId: string }, IDocument>) => {
      const documentId = request.params.documentId;
      const documentData = request.body;

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
      const existingDocument = await Document.getDocumentById(
        request.db.connection,
        documentId
      );
      if (!existingDocument) {
        throw DocumentDoesNotExist.forId(documentId);
      }

      await existingDocument.preprocess(request.db.connection);
      const oldOrderedList = AnchorsNode.getOrderedAnchorListFromTree(
        existingDocument.anchors
      );
      // captured before mergeDeep below, which mutates existingDocument
      const oldContent = existingDocument.content;

      const model = new Document({
        ...mergeDeep(existingDocument, documentData),
        id: documentId,
      });

      await model.preprocess(request.db.connection);

      if (!model.isValid()) {
        throw new ModelNotValidError("");
      }

      if (
        !(await userCanManageDocument(
          request.db.connection,
          documentId,
          request.getUserOrFail()
        ))
      ) {
        throw new PermissionDeniedError("document cannot be saved");
      }

      const result = await model.update(request.db.connection, model);

      if (result.replaced || result.unchanged) {
        const newOrderedList = AnchorsNode.getOrderedAnchorListFromTree(
          model.anchors
        );
        const anchorDiff = AnchorsNode.diffOrderedAnchorLists(
          oldOrderedList,
          newOrderedList
        );
        const anchorTagDiff = AnchorsNode.diffAnchorTagsInContent(
          oldContent,
          model.content
        );
        const auditType = Audit.resolveDocumentAuditType({
          anchorsAdded: anchorTagDiff.added,
          anchorsRemoved: anchorTagDiff.removed,
          anchorAttributesChanged: anchorTagDiff.attributesChanged,
          contentChanged: oldContent !== model.content,
        });
        const auditData = AnchorsNode.finalizeDocumentAuditChanges({
          auditType,
          oldContent,
          newContent: model.content,
          treeDiff: anchorDiff,
          newOrderedList,
        });
        await Audit.createNew(
          request,
          AuditScope.Document,
          documentId,
          auditData,
          auditType
        );
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

      const existing = await Document.getDocumentById(
        request.db.connection,
        id
      );
      if (!existing) {
        throw DocumentDoesNotExist.forId(id);
      }

      if (
        !(await userCanManageDocument(
          request.db.connection,
          id,
          request.getUserOrFail()
        ))
      ) {
        throw new PermissionDeniedError(
          "document cannot be deleted by current user"
        );
      }

      const result = await existing.delete(request.db.connection);

      if (result.deleted === 1) {
        await Audit.createDeletionAudit(
          request.db.connection,
          id,
          request.getUserOrFail().id,
          AuditScope.Document
        );
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot delete document ${id}`);
      }
    })
  )
  .patch(
    "/:documentId/removeAnchors",
    asyncRouteHandler<IResponseGeneric>(
      async (
        request: IRequest<
          { documentId: string },
          unknown,
          { entityIds: string[] | string }
        >
      ) => {
        const id = request.params.documentId;
        if (!id) {
          throw new BadParams("document id has to be set");
        }

        await request.db.lock();

        const existing = await Document.getDocumentById(
          request.db.connection,
          id
        );
        if (!existing) {
          throw DocumentDoesNotExist.forId(id);
        }

        if (
          !(await userCanManageDocument(
            request.db.connection,
            id,
            request.getUserOrFail()
          ))
        ) {
          throw new PermissionDeniedError("document cannot be edited");
        }

        const entityIds: string[] | string = request.query.entityIds;
        existing.removeAnchors(
          typeof entityIds === "object" ? entityIds : [entityIds]
        );

        const result = await existing.update(request.db.connection, {
          content: existing.content,
          entityIds: existing.entityIds,
        });

        return {
          result: !!result.replaced,
        };
      }
    )
  )
  .patch(
    "/:documentId/removeAnchor",
    asyncRouteHandler<IResponseGeneric<any>>(
      async (
        request: IRequest<
          { documentId: string },
          { entityId: string; anchorIndex: number }
        >
      ) => {
        const id = request.params.documentId;
        if (!id) {
          throw new BadParams("document id has to be set");
        }

        const { entityId, anchorIndex } = request.body;
        if (!entityId || anchorIndex < 0) {
          throw new BadParams("entiyId and anchorIndex has to be set");
        }

        await request.db.lock();

        const existing = await Document.getDocumentById(
          request.db.connection,
          id
        );
        if (!existing) {
          throw DocumentDoesNotExist.forId(id);
        }

        if (
          !(await userCanManageDocument(
            request.db.connection,
            id,
            request.getUserOrFail()
          ))
        ) {
          throw new PermissionDeniedError("document cannot be edited");
        }

        existing.removeAnchor(entityId, anchorIndex);
        await existing.preprocess(request.db.connection);

        const result = await existing.update(request.db.connection, {
          content: existing.content,
          entityIds: existing.entityIds,
        });

        return {
          result: !!result.replaced,
        };
      }
    )
  )
  .get(
    "/:documentId/anchors",
    asyncRouteHandler<IResponseGeneric<string>>(
      async (
        request: IRequest<
          {
            documentId: string;
          },
          any,
          {
            entityId: string;
            index: string;
          }
        >
      ) => {
        const id = request.params.documentId;
        if (!id) {
          throw new BadParams("document id has to be set");
        }
        const { entityId, index } = request.query;
        if (!entityId || index === undefined) {
          throw new BadParams("entityId and anchorIndex needs to be set");
        }

        const existing = await Document.getDocumentById(
          request.db.connection,
          id
        );
        if (!existing) {
          throw DocumentDoesNotExist.forId(id);
        }

        const anchor = existing.findAnchorWithIndex(entityId, parseInt(index));

        return {
          result: true,
          data: anchor?.content || "",
        };
      }
    )
  );
