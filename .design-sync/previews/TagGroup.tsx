import React from "react";
import { EntityEnums, TagGroup } from "dissinet.ddb.client";

// TagGroup renders its own EntityTags from entity objects — it is not a
// generic layout wrapper. Fixtures mirror packages/shared/types/entity.ts
// (IEntity), restricted to classes the client's EntityColors table covers
// (T, R, A, S, C, E, G, L).
const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
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

export const Default = () => <TagGroup definedEntities={[councilOfTrent, toConvene]} />;

export const SingleEntity = () => <TagGroup definedEntities={[trento]} />;

// Past the oversize limit the remaining entities collapse behind a "..."
// marker rather than growing the row.
export const Oversized = () => (
  <TagGroup
    definedEntities={[councilOfTrent, toConvene, ecumenicalCouncil, trento, habsburgDynasty]}
    oversizeLimit={2}
  />
);

export const HigherLimit = () => (
  <Row>
    <TagGroup
      definedEntities={[councilOfTrent, toConvene, ecumenicalCouncil, trento, habsburgDynasty, peaceOfAugsburg]}
      oversizeLimit={4}
    />
  </Row>
);
