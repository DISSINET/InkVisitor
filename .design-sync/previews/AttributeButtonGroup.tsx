import React from "react";
import { AttributeButtonGroup, IcoPlus, IcoReplace } from "dissinet.ddb.client";

// A two-option group acts as a single toggle: clicking either segment
// switches to the other, as in the territory-filter's OR/AND operator.
export const Toggle = () => (
  <AttributeButtonGroup
    options={[
      { longValue: "OR", shortValue: "OR", onClick: () => {}, selected: false },
      { longValue: "AND", shortValue: "AND", onClick: () => {}, selected: true },
    ]}
  />
);

export const MultiSelect = () => (
  <AttributeButtonGroup
    canSelectMultiple
    options={[
      { longValue: "Person", shortValue: "Person", onClick: () => {}, selected: true },
      { longValue: "Group", shortValue: "Group", onClick: () => {}, selected: false },
      { longValue: "Location", shortValue: "Location", onClick: () => {}, selected: true },
      { longValue: "Object", shortValue: "Object", onClick: () => {}, selected: false },
    ]}
  />
);

export const IconsOnly = () => (
  <AttributeButtonGroup
    iconsOnly
    options={[
      {
        longValue: "append",
        shortValue: "append",
        icon: <IcoPlus />,
        onClick: () => {},
        selected: true,
      },
      {
        longValue: "replace",
        shortValue: "replace",
        icon: <IcoReplace />,
        onClick: () => {},
        selected: false,
      },
    ]}
  />
);

export const FourOptions = () => (
  <AttributeButtonGroup
    options={[
      { longValue: "Owner", shortValue: "Owner", onClick: () => {}, selected: false },
      { longValue: "Admin", shortValue: "Admin", onClick: () => {}, selected: true },
      { longValue: "Editor", shortValue: "Editor", onClick: () => {}, selected: false },
      { longValue: "Viewer", shortValue: "Viewer", onClick: () => {}, selected: false },
    ]}
  />
);

export const Disabled = () => (
  <AttributeButtonGroup
    disabled
    disabledBtnsTooltip="Locked while the statement is being reviewed"
    options={[
      { longValue: "OR", shortValue: "OR", onClick: () => {}, selected: false },
      { longValue: "AND", shortValue: "AND", onClick: () => {}, selected: true },
    ]}
  />
);

export const FullWidth = () => (
  <div style={{ width: 320 }}>
    <AttributeButtonGroup
      fullWidth
      options={[
        { longValue: "Textual", shortValue: "Textual", onClick: () => {}, selected: true },
        {
          longValue: "Interpretive",
          shortValue: "Interpretive",
          onClick: () => {},
          selected: false,
        },
      ]}
    />
  </div>
);
