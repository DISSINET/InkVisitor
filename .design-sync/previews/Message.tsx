import React from "react";
import { EntityEnums, Message } from "dissinet.ddb.client";

const Col: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: 420 }}>
    {children}
  </div>
);

const makeEntity = (
  id: string,
  label: string,
  cls: keyof typeof EntityEnums.Class
) => ({
  id,
  class: EntityEnums.Class[cls],
  status: EntityEnums.Status.Approved,
  data: {},
  labels: [label],
  detail: "",
  language: EntityEnums.Language.Latin,
  notes: [],
  props: [],
  references: [],
});

// A shared entity pool so warnings that cross-reference each other (e.g. a
// T-based warning's origin territory plus the entity it validates) resolve
// without Message falling back to its own live entity fetch.
const entities: Record<string, any> = {
  "ent-trent": makeEntity("ent-trent", "Council of Trent", "Territory"),
  "ent-charlesv": makeEntity("ent-charlesv", "Charles V", "Person"),
  "ent-justification": makeEntity("ent-justification", "Justification", "Concept"),
  "ent-heresy": makeEntity("ent-heresy", "Heresy", "Concept"),
  "ent-eucharist": makeEntity("ent-eucharist", "Real Presence", "Concept"),
  "ent-proptype-doctrine": makeEntity("ent-proptype-doctrine", "Doctrinal Classification", "Concept"),
  "ent-stmt-session6": makeEntity("ent-stmt-session6", "Session VI, canon 1", "Statement"),
};

export const ValencyWarning = () => (
  <Col>
    <Message
      warning={{
        type: "MA",
        origin: "ent-stmt-session6",
        position: { section: "Valencies", subSection: "a1" },
      } as any}
      entities={entities}
    />
  </Col>
);

export const ActantMismatch = () => (
  <Col>
    <Message
      warning={{
        type: "WA",
        origin: "ent-stmt-session6",
        position: { section: "Valencies", subSection: "a2", entityId: "ent-charlesv" },
      } as any}
      entities={entities}
    />
  </Col>
);

export const SynonymCloudMismatch = () => (
  <Col>
    <Message
      warning={{
        type: "ISYNC",
        origin: "ent-justification",
        details: [
          { entityId: "ent-justification", relatedEntityIds: ["ent-heresy"] },
        ],
      } as any}
      entities={entities}
    />
  </Col>
);

export const MissingProperty = () => (
  <Col>
    <Message
      warning={{
        type: "TVEPT",
        origin: "ent-trent",
        position: { section: "Entity", entityId: "ent-eucharist" },
        validation: {
          propType: ["ent-proptype-doctrine"],
          detail: "per Session XIII, canon 1",
        },
      } as any}
      entities={entities}
    />
  </Col>
);

export const WrongPropertyValue = () => (
  <Col>
    <Message
      warning={{
        type: "TVEPV",
        origin: "ent-trent",
        position: { section: "Entity", entityId: "ent-eucharist" },
        validation: {
          propType: ["ent-proptype-doctrine"],
          allowedEntities: ["ent-heresy"],
        },
      } as any}
      entities={entities}
    />
  </Col>
);
