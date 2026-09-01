import React from "react";
import { EntityEnums, EntityTag } from "dissinet.ddb.client";

// EntityTag takes a full entity object. Fixtures mirror the shape from
// packages/shared/types/entity.ts (IEntity) — only the fields the component
// actually reads are filled in beyond the required ones. entity.class is
// restricted to the classes the client's EntityColors table covers (T, R, A,
// S, C, E, G, L); other classes have no color entry and the component reads
// it unguarded.
const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
    {children}
  </div>
);

let idSeq = 0;
const entity = (overrides: Record<string, unknown>) => ({
  id: `entity-${idSeq++}`,
  status: EntityEnums.Status.Approved,
  data: {},
  detail: "",
  language: EntityEnums.Language.English,
  notes: [],
  props: [],
  references: [],
  isTemplate: false,
  ...overrides,
});

const councilOfTrent = entity({ class: EntityEnums.Class.Territory, labels: ["Council of Trent"] });
const toConvene = entity({ class: EntityEnums.Class.Action, labels: ["to convene"] });
const ecumenicalCouncil = entity({ class: EntityEnums.Class.Concept, labels: ["ecumenical council"] });
const trento = entity({ class: EntityEnums.Class.Location, labels: ["Trento"] });
const habsburgDynasty = entity({ class: EntityEnums.Class.Group, labels: ["Habsburg dynasty"] });
const peaceOfAugsburg = entity({ class: EntityEnums.Class.Event, labels: ["Peace of Augsburg"] });
const tridentineDecrees = entity({ class: EntityEnums.Class.Resource, labels: ["Tridentine decrees"] });
const councilStatement = entity({
  class: EntityEnums.Class.Statement,
  labels: [],
  data: { text: "Charles V convened the council at Trent in 1545." },
});

export const Default = () => <EntityTag entity={councilOfTrent} disableTooltip />;

export const EntityClassSweep = () => (
  <Row>
    <EntityTag entity={councilOfTrent} disableTooltip />
    <EntityTag entity={toConvene} disableTooltip />
    <EntityTag entity={ecumenicalCouncil} disableTooltip />
    <EntityTag entity={trento} disableTooltip />
    <EntityTag entity={habsburgDynasty} disableTooltip />
    <EntityTag entity={peaceOfAugsburg} disableTooltip />
    <EntityTag entity={tridentineDecrees} disableTooltip />
  </Row>
);

export const StatusVariants = () => (
  <Row>
    <EntityTag entity={entity({ class: EntityEnums.Class.Territory, labels: ["Diocese of Trento"], status: EntityEnums.Status.Pending })} disableTooltip />
    <EntityTag entity={entity({ class: EntityEnums.Class.Territory, labels: ["Diocese of Trento"], status: EntityEnums.Status.Approved })} disableTooltip />
    <EntityTag entity={entity({ class: EntityEnums.Class.Territory, labels: ["Diocese of Trento"], status: EntityEnums.Status.Discouraged })} disableTooltip />
    <EntityTag entity={entity({ class: EntityEnums.Class.Territory, labels: ["Diocese of Trento"], status: EntityEnums.Status.Warning })} disableTooltip />
  </Row>
);

export const StatementNoLabel = () => <EntityTag entity={councilStatement} disableTooltip />;

export const Selected = () => <EntityTag entity={habsburgDynasty} isSelected disableTooltip />;

export const FavoritedWithUnlink = () => (
  <EntityTag
    entity={councilOfTrent}
    isFavorited
    disableTooltip
    unlinkButton={{ onClick: () => {}, tooltipLabel: "unlink entity" }}
  />
);
