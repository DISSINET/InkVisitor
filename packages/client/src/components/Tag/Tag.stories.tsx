import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { QueryClient, QueryClientProvider } from "react-query";
import { Story } from "@storybook/react";

import { Entities } from "types";
import { Tag, Button } from "components";

const queryClient = new QueryClient();

export default {
  title: "Tag",
  parameters: {
    info: { inline: true },
  },
  decorators: [
    (Story: Story) => (
      <QueryClientProvider client={queryClient}>
        <DndProvider backend={HTML5Backend}>
          <Story />
        </DndProvider>
      </QueryClientProvider>
    ),
  ],
};

export const DefaultTag = () => {
  return (
    <Tag propId="0" category={Entities["T"].id} color={Entities["T"].color} />
  );
};

export const TagWithLabel = () => {
  return (
    <Tag
      propId="0"
      category={Entities["R"].id}
      color={Entities["R"].color}
      label="entity label"
    />
  );
};

export const ShortTagWithLabel = () => {
  return (
    <Tag
      propId="0"
      category={Entities["T"].id}
      color={Entities["T"].color}
      label="entity label"
      short
    />
  );
};

export const TagWithInvertedLabel = () => {
  return (
    <Tag
      propId="0"
      category={Entities["S"].id}
      color={Entities["S"].color}
      label="entity label"
      invertedLabel
    />
  );
};

export const TagWithLabelIndefinitive = () => {
  return (
    <Tag
      propId="0"
      category={Entities["R"].id}
      color={Entities["R"].color}
      label="entity label"
      borderStyle={"dashed"}
    />
  );
};

export const TagWithInvertedLabelIndefinitive = () => {
  return (
    <Tag
      propId="0"
      category={Entities["R"].id}
      color={Entities["R"].color}
      label="entity label"
      borderStyle={"dotted"}
      invertedLabel
    />
  );
};

export const TagWithLabelHypothetical = () => {
  return (
    <Tag
      propId="0"
      category={Entities["S"].id}
      color={Entities["S"].color}
      label="entity label"
      borderStyle={"dotted"}
    />
  );
};

export const TagWithLabelAndButton = () => {
  return (
    <Tag
      propId="0"
      category={Entities["E"].id}
      color={Entities["E"].color}
      label="entity label"
      button={<Button label="x" color="danger" />}
    />
  );
};

export const TagWithVeryLongLabel = () => {
  return (
    <Tag
      propId="0"
      category={Entities["P"].id}
      color={Entities["P"].color}
      label="entity label entity label entity label"
      button={<Button label="x" color="danger" />}
    />
  );
};
