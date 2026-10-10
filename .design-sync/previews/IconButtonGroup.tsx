import React from "react";
import {
  EntityEnums,
  IcoCommentAdd,
  IcoCommentRemove,
  IcoDatasetLinked,
  IcoFileTextFill,
  IcoLinkExternal,
  IconButtonGroup,
} from "dissinet.ddb.client";

const elvlIcons = {
  [EntityEnums.Elvl.Textual]: <IcoFileTextFill size={14} />,
  [EntityEnums.Elvl.Interpretive]: <IcoDatasetLinked size={14} />,
  [EntityEnums.Elvl.Inferential]: <IcoLinkExternal size={14} />,
};

const elvlOptions = [
  { value: EntityEnums.Elvl.Textual, label: "textual", info: "stated directly in the source" },
  { value: EntityEnums.Elvl.Interpretive, label: "interpretive" },
  { value: EntityEnums.Elvl.Inferential, label: "inferential" },
];

// The epistemic-level group, as it appears next to every statement property:
// three segments, the selected one filled and bold.
export const Default = () => (
  <IconButtonGroup
    attributeName="epistemic level"
    options={elvlOptions}
    icons={elvlIcons}
    value={EntityEnums.Elvl.Interpretive}
    onChange={() => {}}
  />
);

export const Bordered = () => (
  <IconButtonGroup
    attributeName="epistemic level"
    border
    options={elvlOptions}
    icons={elvlIcons}
    value={EntityEnums.Elvl.Textual}
    onChange={() => {}}
  />
);

export const SharpCorners = () => (
  <IconButtonGroup
    attributeName="epistemic level"
    sharpCorners
    border
    options={elvlOptions}
    icons={elvlIcons}
    value={EntityEnums.Elvl.Inferential}
    onChange={() => {}}
  />
);

const logicIcons = {
  [EntityEnums.Logic.Positive]: <IcoCommentAdd size={14} />,
  [EntityEnums.Logic.Negative]: <IcoCommentRemove size={14} />,
};

export const TwoOptions = () => (
  <IconButtonGroup
    attributeName="logic"
    options={[
      { value: EntityEnums.Logic.Positive, label: "positive" },
      { value: EntityEnums.Logic.Negative, label: "negative" },
    ]}
    icons={logicIcons}
    value={EntityEnums.Logic.Positive}
    onChange={() => {}}
  />
);

// Disabled hides every option except the selected one — nothing left to pick.
export const Disabled = () => (
  <IconButtonGroup
    attributeName="epistemic level"
    disabled
    options={elvlOptions}
    icons={elvlIcons}
    value={EntityEnums.Elvl.Textual}
    onChange={() => {}}
  />
);

// A warning ring prompting the user to pick a value for this attribute.
export const Warning = () => (
  <IconButtonGroup
    attributeName="epistemic level"
    warning
    border
    options={elvlOptions}
    icons={elvlIcons}
    value={EntityEnums.Elvl.Textual}
    onChange={() => {}}
  />
);
