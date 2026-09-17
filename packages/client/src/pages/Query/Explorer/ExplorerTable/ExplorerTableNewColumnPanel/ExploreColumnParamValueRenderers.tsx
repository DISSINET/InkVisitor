import { RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity, Relation } from "@inkvisitor/shared/types";
import { Explore } from "@inkvisitor/shared/types/query";
import { EntityTagById } from "components/advanced";
import React from "react";

/**
 * Label of a relation column direction: the relation name, or for an inverse
 * column the relation's inverse label ("Subclasses" for Superclass).
 */
export const getRelationColumnLabel = (
  relationType: RelationEnums.Type,
  inverse?: boolean,
): string => {
  const label = RelationEnums.RelationTypeLabels[relationType] ?? String(relationType);
  if (!inverse) {
    return label;
  }
  const inverseLabel = Relation.RelationRules[relationType]?.inverseLabel;
  return `${inverseLabel || label} (inverse)`;
};

export interface IExploreColumnParamRenderContext {
  value: unknown;
  paramDef: Explore.IExploreColumnParamDef;
  /** All params of the column, for values whose meaning depends on a sibling param. */
  params?: Record<string, unknown>;
  entities?: Record<string, IEntity>;
}

export type ExploreColumnParamValueRenderer = (
  ctx: IExploreColumnParamRenderContext,
) => React.ReactNode;

export const exploreColumnParamValueRenderers: Record<
  Explore.ExploreColumnParamValueType,
  ExploreColumnParamValueRenderer
> = {
  relationType: ({ value, params }) => {
    if (value == null) return null;
    return getRelationColumnLabel(value as RelationEnums.Type, !!params?.inverse);
  },
  entity: ({ value, entities }) => {
    if (value == null) return null;
    const entityId = typeof value === "string" ? value : (value as IEntity)?.id;
    if (!entityId) return null;
    const entity = entities?.[entityId];
    return <EntityTagById entityId={entityId} entity={entity} />;
  },
};

export const renderExploreColumnParamValue = (
  ctx: IExploreColumnParamRenderContext,
): React.ReactNode => {
  const renderer = exploreColumnParamValueRenderers[ctx.paramDef.type];
  return renderer ? renderer(ctx) : String(ctx.value ?? "");
};
