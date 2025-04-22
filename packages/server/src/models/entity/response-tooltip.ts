import Document, { TreeNode } from "@models/document/document";
import { UsedRelations } from "@models/relation/relations";
import Resource from "@models/resource/resource";
import { EntityEnums, RelationEnums } from "@shared/enums";
import { EntityTooltip, IEntity } from "@shared/types";
import { IResponseUsedInDocument } from "@shared/types/response-detail";
import { Connection } from "rethinkdb-ts";
import { IRequest } from "src/custom_typings/request";
import Entity from "./entity";
import { ResponseEntity } from "./response";

export class ResponseTooltip
  extends ResponseEntity
  implements EntityTooltip.IResponse
{
  entities: Record<string, IEntity> = {};
  relations: UsedRelations;
  usedInDocuments: IResponseUsedInDocument[] = [];

  constructor(entity: Entity) {
    super(entity);
    this.relations = new UsedRelations(entity.id, entity.class);
    this.relations.maxListLen = 10;
    this.usedInDocuments = [];
  }

  /**
   * Loads additional fields to satisfy the EntityTooltip.IResponse interface
   * @param request
   */
  async prepare(request: IRequest) {
    super.prepare(request);

    await this.relations.prepare(request, [
      RelationEnums.Type.Superclass,
      RelationEnums.Type.SuperordinateEntity,
      RelationEnums.Type.Synonym,
      RelationEnums.Type.ActionEventEquivalent,
      RelationEnums.Type.Classification,
      RelationEnums.Type.Identification,
      RelationEnums.Type.SubjectSemantics,
      RelationEnums.Type.Actant1Semantics,
      RelationEnums.Type.Actant2Semantics,
    ]);

    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Superclass)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(
        RelationEnums.Type.SuperordinateEntity
      )
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Synonym)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(
        RelationEnums.Type.ActionEventEquivalent
      )
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Classification)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Identification)
    );

    // semantics
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.SubjectSemantics)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Actant1Semantics)
    );
    this.addLinkedEntities(
      this.relations.getEntityIdsFromType(RelationEnums.Type.Actant2Semantics)
    );

    this.usedInDocuments = await this.findUsedInDocuments(
      request.db.connection
    );

    this.entities = await this.populateEntitiesMap(request.db.connection);
  }

  /**
   * returns data for usedInDocuments(IResponseUsedInDocument[]) field
   * @param conn
   * @returns
   */
  async findUsedInDocuments(
    conn: Connection
  ): Promise<IResponseUsedInDocument[]> {
    const out: IResponseUsedInDocument[] = [];
    await Promise.all(
      (
        await Document.findByEntityId(conn, this.id)
      ).map(async (docData) => {
        // construct document and tree node filled with entities data
        const doc = new Document({
          content: docData.content,
        });
        const anchors = doc.buildAnchorsTree();
        const anchoredEntities = await Entity.findEntitiesByIds(
          conn,
          doc.collectAnchors(anchors)
        );
        doc.assignClassesBasedOnEntities(anchors, anchoredEntities);

        const resource = await Resource.findByDocumentId(conn, docData.id);

        // traverse the tree, search for anchor that === this.id
        const traverse = (nodes: TreeNode[], parentT?: string) => {
          for (const node of nodes) {
            if (node.anchor === this.id) {
              out.push({
                document: {
                  id: docData.id,
                  title: docData.title,
                  entityIds: docData.entityIds,
                  createdAt: docData.createdAt,
                  updatedAt: docData.updatedAt,
                },
                anchorText: node.getShortContent(),
                resourceId: resource?.id || "",
                parentTerritoryId: parentT || "",
              });
            }

            traverse(
              node.children,
              node.class === EntityEnums.Class.Territory ? node.anchor : parentT
            );
          }
        };

        traverse(anchors);
      })
    );

    return out;
  }
}
