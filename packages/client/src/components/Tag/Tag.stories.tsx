import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Entities } from "types";
import { Tag, Button, TagGroup } from "components";

export default {
  title: "Tag",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultTag = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Tag category={Entities["T"].id} color={Entities["T"].color} />
    </DndProvider>
  );
};

export const TagWithLabel = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Tag
        category={Entities["R"].id}
        color={Entities["R"].color}
        label="entity label"
      />
    </DndProvider>
  );
};

export const ShortTagWithLabel = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Tag
        category={Entities["T"].id}
        color={Entities["T"].color}
        label="entity label"
        short
      />
    </DndProvider>
  );
};

export const TagWithInvertedLabel = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Tag
        category={Entities["S"].id}
        color={Entities["S"].color}
        label="entity label"
        invertedLabel
      />
    </DndProvider>
  );
};

export const TagWithLabelIndefinitive = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Tag
        category={Entities["R"].id}
        color={Entities["R"].color}
        label="entity label"
        borderStyle={"dashed"}
      />
    </DndProvider>
  );
};

export const TagWithInvertedLabelIndefinitive = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Tag
        category={Entities["R"].id}
        color={Entities["R"].color}
        label="entity label"
        borderStyle={"dotted"}
        invertedLabel
      />
    </DndProvider>
  );
};

export const TagWithLabelHypothetical = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Tag
        category={Entities["S"].id}
        color={Entities["S"].color}
        label="entity label"
        borderStyle={"dotted"}
      />
    </DndProvider>
  );
};

export const TagWithLabelAndButton = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Tag
        category={Entities["E"].id}
        color={Entities["E"].color}
        label="entity label"
        button={<Button label="x" color="danger" />}
      />
    </DndProvider>
  );
};

export const TagWithVeryLongLabel = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Tag
        category={Entities["P"].id}
        color={Entities["P"].color}
        label="entity label entity label entity label"
        button={<Button label="x" color="danger" />}
      />
    </DndProvider>
  );
};
