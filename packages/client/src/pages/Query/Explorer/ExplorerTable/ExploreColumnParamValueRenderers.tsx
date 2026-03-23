import React from "react";
import { IEntity } from "@shared/types";
import { Explore } from "@shared/types/query";
import { RelationEnums } from "@shared/enums";
import { EntityTag } from "components/advanced";
import { EntityTagById } from "./EntityTagById";

export interface IExploreColumnParamRenderContext {
  value: unknown;
  paramDef: Explore.IExploreColumnParamDef;
  entities?: Record<string, IEntity>;
}

export type ExploreColumnParamValueRenderer = (
  ctx: IExploreColumnParamRenderContext
) => React.ReactNode;

export const exploreColumnParamValueRenderers: Record<
  Explore.ExploreColumnParamValueType,
  ExploreColumnParamValueRenderer
> = {
  relationType: ({ value }) => {
    if (value == null) return null;
    return RelationEnums.RelationTypeLabels[
      value as RelationEnums.Type
    ] ?? String(value);
  },
  entity: ({ value, entities }) => {
    if (value == null) return null;
    const entityId = typeof value === "string" ? value : (value as IEntity)?.id;
    if (!entityId) return null;
    const entity = entities?.[entityId];
    return (
      <EntityTagById entityId={entityId} entity={entity} />
    );
  },
};

export const renderExploreColumnParamValue = (
  ctx: IExploreColumnParamRenderContext
): React.ReactNode => {
  const renderer = exploreColumnParamValueRenderers[ctx.paramDef.type];
  return renderer ? renderer(ctx) : String(ctx.value ?? "");
};
