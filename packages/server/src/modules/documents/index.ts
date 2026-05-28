import { mergeDeep } from "@common/functions";
import Audit from "@models/audit/audit";
import { ResponseDocumentAudit } from "@models/audit/response";
import Document from "@models/document/document";
import Entity from "@models/entity/entity";
import { AnchorsNode } from "@models/document/anchors";
import { EntityEnums } from "@inkvisitor/shared/enums";
import {
  IDocument,
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
import { r as rethink } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import { asyncRouteHandler } from "../index";
import { createOpeningTagRegex, closingTagRegex } from "@common/regex";

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
      const conn = request.db.connection;

      // Metadata-only fetch. The `content` field is potentially MB-scale
      // and unused by the list response; legacy docs missing stored
      // anchors get their content fetched in a targeted second pass below.
      const docs = (await rethink
        .table(Document.table)
        .orderBy(rethink.asc("createdAt"))
        .without("content")
        .run(conn)) as IDocument[];

      const documents: Document[] = [];
      const legacyDocs: Document[] = [];
      for (const d of docs) {
        const document = new Document(d);
        documents.push(document);
        if (!document.anchors || document.anchors.length === 0) {
          legacyDocs.push(document);
        }
      }

      // Only fetch content + run preprocess for docs that don't have
      // stored anchors yet. New writes save anchors at preprocess time,
      // so this branch is purely a fallback for legacy rows.
      if (legacyDocs.length > 0) {
        const legacyContents = (await rethink
          .table(Document.table)
          .getAll(...legacyDocs.map((d) => d.id))
          .pluck("id", "content")
          .run(conn)) as { id: string; content: string }[];
        const contentById = new Map(
          legacyContents.map((c) => [c.id, c.content])
        );
        for (const doc of legacyDocs) {
          doc.content = contentById.get(doc.id) || "";
        }

        // One batched entity-class lookup for every legacy doc combined.
        const allReferencedIds = new Set<string>();
        const pending: { doc: Document; ids: string[] }[] = [];
        for (const doc of legacyDocs) {
          const ids = doc.gatherEntityIds();
          if (ids.length > 0) {
            pending.push({ doc, ids });
            for (const id of ids) allReferencedIds.add(id);
          }
        }
        if (allReferencedIds.size > 0) {
          const entities = await Entity.findEntitiesByIds(conn, [
            ...allReferencedIds,
          ]);
          const classById = new Map<string, EntityEnums.Class>();
          for (const e of entities) {
            if (e.class) classById.set(e.id, e.class);
          }
          for (const { doc, ids } of pending) {
            doc.preprocessSync(classById, ids);
          }
        }
      }

      return documents.map((document) => {
        // @ts-ignore content is part of IDocument but trimmed from IDocumentMeta
        delete document.content;
        // anchors trees can be ~1MB per doc. None of the list consumers
        // (DocumentsPage, StatementsListBox, EntityDetailFormSection)
        // read anchors here; the full tree is loaded via GET /documents/:id
        // when actually needed. Shipping an empty array keeps the wire
        // payload small.
        document.anchors = [];
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

    const openingTagRegex = createOpeningTagRegex();
    const closingTagRegexInstance = closingTagRegex;

    let filteredContent = document.content;
    let match;

    while ((match = openingTagRegex.exec(document.content)) !== null) {
      const fullTag = match[0];
      const tagContent = match[1];
      const entityId = tagContent.split(/\s+/)[0];

      let validEntityClass = false;
      let isUnknownEntity = true;

      exportedEntities.forEach((entityClass) => {
        if (document.entityIds[entityClass]) {
          document.entityIds[entityClass].forEach((id) => {
            if (id === entityId) {
              validEntityClass = true;
              isUnknownEntity = false;
            }
          });
        }
      });

      Object.values(EntityEnums.Class).forEach((entityClass) => {
        if (document.entityIds[entityClass]) {
          document.entityIds[entityClass].forEach((id) => {
            if (id === entityId) {
              isUnknownEntity = false;
            }
          });
        }
      });

      if (!validEntityClass && !isUnknownEntity) {
        filteredContent = filteredContent.replace(fullTag, "");
      }
    }

    while ((match = closingTagRegexInstance.exec(document.content)) !== null) {
      const fullTag = match[0];
      const entityId = match[1];

      let validEntityClass = false;
      let isUnknownEntity = true;

      exportedEntities.forEach((entityClass) => {
        if (document.entityIds[entityClass]) {
          document.entityIds[entityClass].forEach((id) => {
            if (id === entityId) {
              validEntityClass = true;
              isUnknownEntity = false;
            }
          });
        }
      });

      // Also check all entity classes to determine if this is an unknown entity
      Object.values(EntityEnums.Class).forEach((entityClass) => {
        if (document.entityIds[entityClass]) {
          document.entityIds[entityClass].forEach((id) => {
            if (id === entityId) {
              isUnknownEntity = false;
            }
          });
        }
      });

      // Keep the tag if it's in exported entities OR if it's an unknown entity
      if (!validEntityClass && !isUnknownEntity) {
        // Remove the closing tag if entity is not in exported entities and is not unknown
        filteredContent = filteredContent.replace(fullTag, "");
      }
    }

    res.setHeader("content-type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename="export.txt"`);
    res.send(filteredContent);
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

      if (!model.canBeEditedByUser(request.getUserOrFail())) {
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
        await Audit.createNewForDocument(
          request,
          documentId,
          auditType,
          auditData
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

      if (!existing.canBeDeletedByUser(request.getUserOrFail())) {
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
