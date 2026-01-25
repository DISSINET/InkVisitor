import {
  IEntity,
  IResponseDetail,
  Relation
} from "@shared/types";
import { LetterIcon } from "components";
import { EntityTag, PaginationControls } from "components/advanced";
import { usePagination } from "hooks/usePagination";
import React, { useMemo } from "react";
import {
  StyledHeading,
  StyledInverseRelationGroup,
  StyledPaginationWrapper,
  StyledTagWrapper,
} from "./EntityDetailInverseRelationStyles";

interface EntityDetailInverseRelation {
  entity: IResponseDetail;
  relationRule: Relation.RelationRule;
  relationType: string;
  relations?: Relation.IRelation[];
  entities: Record<string, IEntity>;
}
export const EntityDetailInverseRelation: React.FC<
  EntityDetailInverseRelation
> = ({ entity, relationType, relationRule, relations, entities }) => {
  const filteredRelations = useMemo(() => {
    return (
      relations?.filter((relation) => {
        const relationEntity = entities[relation.entityIds[0]];
        return (
          relation.entityIds[0] !== entity.id && relationEntity !== undefined
        );
      }) || []
    );
  }, [relations, entities, entity.id]);

  const {
    paginatedItems,
    currentPage,
    totalPages,
    showPagination,
    handlePreviousPage,
    handleNextPage,
  } = usePagination({
    items: filteredRelations,
    itemsPerPage: 20,
    level: 1,
  });

  return (
    <>
      <StyledHeading
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "end",
          gap: "1.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "space-between", paddingRight: "5px" }}>
          <b>{filteredRelations.length} {relationRule.inverseLabel}</b>
          <i> - inverse of</i>
          <LetterIcon letter={relationType} color="info" />
        </div>
        {showPagination && (
          <StyledPaginationWrapper
            style={{ marginLeft: "auto", alignSelf: "center" }}
          >
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPreviousPage={handlePreviousPage}
              onNextPage={handleNextPage}
            />
          </StyledPaginationWrapper>
        )}
      </StyledHeading>
      <StyledInverseRelationGroup>
        {paginatedItems.map((relation, key) => {
          const relationEntity = entities[relation.entityIds[0]];

          return (
            <StyledTagWrapper key={key}>
              <EntityTag entity={relationEntity}  />
            </StyledTagWrapper>
          );
        })}
      </StyledInverseRelationGroup>
    </>
  );
};
