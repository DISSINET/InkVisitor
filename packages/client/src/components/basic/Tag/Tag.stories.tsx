import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { QueryClient, QueryClientProvider } from "react-query";
import { Story } from "@storybook/react";

import { Entities } from "types";
import { Tag, Button } from "components";

const queryClient = new QueryClient();

const entityIds: string[] = Object.entries(Entities).map(
  (e) => e[1].entityClass
);

export default {
  title: "Tag",
  parameters: {
    info: { inline: true },
  },
  args: {
    category: Entities["T"].entityClass,
    borderStyle: "solid",
    label: "",
    detail: "",
    invertedLabel: false,
    short: false,
    fullWidth: false,
    disableTooltip: true,
  },
  argTypes: {
    category: { options: entityIds, control: { type: "select" } },
    borderStyle: {
      options: ["solid", "dashed", "dotted"],
      control: { type: "radio" },
    },
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

export const DefaultTag = ({ ...args }) => {
  return <Tag {...args} propId="0" />;
};

export const TagWithLabelAndButton = ({ ...args }) => {
  return (
    <Tag {...args} propId="0" button={<Button label="x" color="danger" />} />
  );
};
TagWithLabelAndButton.args = {
  category: Entities["E"].entityClass,
  label: "entity label",
};

export const TagWithVeryLongLabel = ({ ...args }) => {
  return (
    <Tag {...args} propId="0" button={<Button label="x" color="danger" />} />
  );
};
TagWithVeryLongLabel.args = {
  category: Entities["P"].entityClass,
  label: "entity label entity label entity label",
  disableTooltip: false,
};
