import React from "react";
import { BreadcrumbItem, EntityEnums, UserEnums } from "dissinet.ddb.client";

// BreadcrumbItem only renders once it has a territory to show: territoryData,
// the tree-cache lookup, or a live fetch. The DS's react-query cache starts
// empty and the fetch is disabled without a login session, so territoryData
// is the only path that renders anything here — matching how the app itself
// passes it in for territories not yet in the tree cache.
const territory = (id: string, label: string) => ({
  id,
  class: EntityEnums.Class.Territory,
  status: EntityEnums.Status.Approved,
  data: {},
  labels: [label],
  detail: "",
  language: EntityEnums.Language.Empty,
  notes: [],
  props: [],
  references: [],
  statements: [],
  entities: {},
  right: UserEnums.RoleMode.Write,
});

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>{children}</div>
);

export const Path = () => (
  <Row>
    <BreadcrumbItem territoryId="T1" territoryData={territory("T1", "Council of Trent") as any} />
    <BreadcrumbItem
      territoryId="T2"
      territoryData={territory("T2", "Third Period (1562–1563)") as any}
    />
    <BreadcrumbItem
      territoryId="T3"
      territoryData={territory("T3", "Session XXII") as any}
      isSelected
    />
  </Row>
);

export const Favorited = () => (
  <BreadcrumbItem
    territoryId="T4"
    territoryData={territory("T4", "Charles V's summons") as any}
    isFavorited
  />
);
