import { languageDict } from "@inkvisitor/shared/dictionaries";
import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity, IProp, ITerritory, Relation } from "@inkvisitor/shared/types";
import { EntityTag } from "components/advanced";
import React, { ReactNode, useMemo } from "react";
import { ImportIssue, ImportPlan } from "utils/entityImport";
import { EntityImportIssueList } from "../EntityImportIssueList";
import {
  StyledEntityBlock,
  StyledMeta,
  StyledNewBadge,
  StyledPreview,
  StyledRelationLabel,
  StyledRow,
  StyledRowLabel,
  StyledSection,
  StyledSectionTitle,
  StyledSummary,
  StyledTreeNode,
} from "./EntityImportPreviewStyles";

interface EntityImportPreview {
  plan: ImportPlan;
  notes: ImportIssue[];
}

const languageName = (language: EntityEnums.Language) =>
  languageDict.find((item) => item.value === language)?.label ?? language;

const count = (amount: number, singular: string, plural: string) =>
  `${amount} ${amount === 1 ? singular : plural}`;

export const EntityImportPreview: React.FC<EntityImportPreview> = ({ plan, notes }) => {
  const entityById = useMemo(
    () =>
      new Map<string, IEntity>(
        [...Object.values(plan.existingEntities), ...plan.entities].map((entity) => [
          entity.id,
          entity,
        ])
      ),
    [plan]
  );
  const newIds = useMemo(() => new Set(plan.entities.map((entity) => entity.id)), [plan]);

  // entities of the input do not exist yet, so their tags must not ask the
  // server for a tooltip
  const tagOf = (entityId: string): ReactNode => {
    const entity = entityById.get(entityId);
    if (!entity) {
      return <StyledMeta>{entityId}</StyledMeta>;
    }
    return (
      <EntityTag
        entity={entity}
        fullWidth
        disableTooltip={newIds.has(entityId)}
        disableDoubleClick
        disableDrag
        disableContextMenu
        disableCopyToClipboard
      />
    );
  };

  const territories = plan.entities.filter(
    (entity) => entity.class === EntityEnums.Class.Territory
  ) as ITerritory[];
  const parentIdOf = (territory: ITerritory) =>
    territory.data.parent ? territory.data.parent.territoryId : "";
  const territoryRoots = [
    ...new Set(territories.map(parentIdOf).filter((parentId) => !newIds.has(parentId))),
  ];
  const renderTerritoryChildren = (parentId: string, depth: number): ReactNode =>
    territories
      .filter((territory) => parentIdOf(territory) === parentId)
      .map((territory) => (
        <React.Fragment key={territory.id}>
          <StyledTreeNode $depth={depth}>
            {tagOf(territory.id)}
            <StyledNewBadge>NEW</StyledNewBadge>
          </StyledTreeNode>
          {renderTerritoryChildren(territory.id, depth + 1)}
        </React.Fragment>
      ));

  const renderProps = (props: IProp[], depth: number): ReactNode =>
    props.map((prop) => (
      <React.Fragment key={prop.id}>
        <StyledRow $depth={depth}>
          {/* nested levels keep the empty label column, so they indent from
              where the first level's tags start */}
          <StyledRowLabel>{depth === 0 ? "metaprop" : ""}</StyledRowLabel>
          {tagOf(prop.type.entityId)}
          <StyledRelationLabel>→</StyledRelationLabel>
          {prop.value.entityId ? tagOf(prop.value.entityId) : <StyledMeta>no value</StyledMeta>}
        </StyledRow>
        {renderProps(prop.children, depth + 1)}
      </React.Fragment>
    ));

  // each relation is listed once, under the first new entity it links
  const relationsShownUnder = (entityId: string) =>
    plan.relations.filter(
      (relation) => relation.entityIds.find((id) => newIds.has(id)) === entityId
    );

  const renderRelation = (relation: Relation.IRelation) => {
    const rule = Relation.RelationRules[relation.type]!;
    return (
      <StyledRow key={relation.id}>
        <StyledRowLabel>relation</StyledRowLabel>
        {rule.asymmetrical ? (
          <>
            {tagOf(relation.entityIds[0])}
            <StyledRelationLabel>{`${rule.label} →`}</StyledRelationLabel>
            {tagOf(relation.entityIds[1])}
          </>
        ) : (
          <>
            <StyledRelationLabel>{`${rule.label}:`}</StyledRelationLabel>
            {relation.entityIds.map((entityId) => (
              <React.Fragment key={entityId}>{tagOf(entityId)}</React.Fragment>
            ))}
          </>
        )}
      </StyledRow>
    );
  };

  return (
    <StyledPreview>
      <StyledSummary>
        {[
          count(plan.entities.length, "entity", "entities"),
          count(plan.relations.length, "relation", "relations"),
        ].join(" · ")}
      </StyledSummary>

      {territoryRoots.length > 0 && (
        <StyledSection>
          <StyledSectionTitle>Territories</StyledSectionTitle>
          {territoryRoots.map((rootId) => (
            <React.Fragment key={rootId}>
              <StyledTreeNode $depth={0}>{tagOf(rootId)}</StyledTreeNode>
              {renderTerritoryChildren(rootId, 1)}
            </React.Fragment>
          ))}
        </StyledSection>
      )}

      <StyledSection>
        <StyledSectionTitle>Entities</StyledSectionTitle>
        {plan.entities.map((entity) => (
          <StyledEntityBlock key={entity.id}>
            <StyledRow>
              {tagOf(entity.id)}
              <StyledNewBadge>NEW</StyledNewBadge>
              {entity.language && <StyledMeta>{languageName(entity.language)}</StyledMeta>}
            </StyledRow>
            {entity.detail && (
              <StyledRow>
                <StyledRowLabel>detail</StyledRowLabel>
                {entity.detail}
              </StyledRow>
            )}
            {entity.notes.map((note, noteIndex) => (
              <StyledRow key={noteIndex}>
                <StyledRowLabel>note</StyledRowLabel>
                {note}
              </StyledRow>
            ))}
            {renderProps(entity.props, 0)}
            {entity.references.map((reference) => (
              <StyledRow key={reference.id}>
                <StyledRowLabel>reference</StyledRowLabel>
                {tagOf(reference.resource)}
                {reference.value && tagOf(reference.value)}
              </StyledRow>
            ))}
            {relationsShownUnder(entity.id).map(renderRelation)}
          </StyledEntityBlock>
        ))}
      </StyledSection>

      <EntityImportIssueList title="Changes the import made to the input" issues={notes} />
    </StyledPreview>
  );
};
