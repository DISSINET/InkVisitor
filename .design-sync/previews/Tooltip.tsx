import React from "react";
import { EntityTag, EntityEnums, Tooltip, theme } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 40, alignItems: "flex-start" }}>
    {children}
  </div>
);

// Every cell here renders Tooltip in its open state (visible + a captured
// referenceElement) rather than relying on a hover the capture harness can't
// simulate — Tooltip is the one component in this group that exposes that
// state directly as props.
const Anchor: React.FC<{ label: string; children?: React.ReactNode }> = ({
  label,
  children,
}) => {
  const [reference, setReference] = React.useState<HTMLDivElement | null>(null);
  return (
    <div style={{ padding: 28 }}>
      <div
        ref={setReference}
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: `${theme.space[2]} ${theme.space[5]}`,
          borderRadius: theme.borderRadius.default,
          border: `1px solid ${theme.color.grey}`,
          fontSize: theme.fontSize.sm,
          background: theme.color.white,
        }}
      >
        {label}
      </div>
      {reference && children && React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            referenceElement: reference,
          })
        : null}
    </div>
  );
};

const makeEntity = (id: string, label: string, cls: keyof typeof EntityEnums.Class) => ({
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

export const Default = () => (
  <Anchor label="Council of Trent">
    <Tooltip visible referenceElement={null as any} label="1545–1563, 25 sessions" />
  </Anchor>
);

export const RichContent = () => (
  <Anchor label="TVEPV">
    <Tooltip
      visible
      referenceElement={null as any}
      label="Entity has a wrong property value"
      content={
        <p>
          Entity has a Prop with a correct type according to the protocol, but
          the Prop value is either missing or wrong.
        </p>
      }
    />
  </Anchor>
);

export const TagGroupContent = () => (
  <Anchor label="+2 more">
    <Tooltip
      visible
      referenceElement={null as any}
      color="success"
      position="right"
      noArrow
      tagGroup
      content={
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <EntityTag entity={makeEntity("e-charlesv", "Charles V", "Person") as any} showOnly="tag" />
          <EntityTag entity={makeEntity("e-philipii", "Philip II", "Person") as any} showOnly="tag" />
        </div>
      }
    />
  </Anchor>
);

export const Positions = () => (
  <Row>
    <Anchor label="top">
      <Tooltip visible referenceElement={null as any} label="Opened 13 December 1545" position="top" />
    </Anchor>
    <Anchor label="left">
      <Tooltip visible referenceElement={null as any} label="Closed 4 December 1563" position="left" />
    </Anchor>
    <Anchor label="no arrow">
      <Tooltip
        visible
        referenceElement={null as any}
        label="Presided by three successive Popes"
        position="bottom"
        noArrow
      />
    </Anchor>
  </Row>
);
