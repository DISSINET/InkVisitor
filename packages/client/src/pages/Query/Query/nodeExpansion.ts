import { IEntity, IResponseEntityExpansion } from "@inkvisitor/shared/types";

export type ExpansionGroup = "equivalents" | "subordinates";

/** `EntityTag`'s provenance-badge variant for each group. */
export type ExpansionVariant = "equivalent" | "subordinate";

export interface ExpansionSection {
  group: ExpansionGroup;
  variant: ExpansionVariant;
  heading: string;
  entities: IEntity[];
}

/**
 * The count a node badge shows: the server's true total, which stays exact even
 * when the row list was capped. Undefined while the request is in flight.
 */
export const expansionCount = (
  data: IResponseEntityExpansion | undefined,
  group: ExpansionGroup,
): number | undefined => data?.totals[group];

const VARIANTS: Record<ExpansionGroup, ExpansionVariant> = {
  equivalents: "equivalent",
  subordinates: "subordinate",
};

/**
 * The popover's single section. Each badge opens its own group, so a popover
 * never mixes equivalents with subordinates. Null when there is no data yet or
 * the group is empty, which the popover reports as a message instead.
 */
export const buildExpansionSection = (
  data: IResponseEntityExpansion | undefined,
  group: ExpansionGroup,
): ExpansionSection | null => {
  if (!data || data.totals[group] === 0) {
    return null;
  }

  const entities = data[group];
  const total = data.totals[group];
  const shown = entities.length;

  return {
    group,
    variant: VARIANTS[group],
    // shown can trail total even without truncation - a dangling relation id
    // that no longer resolves to a live entity is silently dropped server-side
    // (Entity.findEntitiesByIds) - so the "showing N of total" wording is
    // reserved for an actual EXPANSION_RESPONSE_MAX cut
    heading: data.truncated[group]
      ? `${group} (showing ${shown} of ${total})`
      : `${group} (${total})`,
    entities,
  };
};
