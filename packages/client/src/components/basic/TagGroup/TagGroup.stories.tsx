import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Story } from "@storybook/react";

import { Entities } from "types";
import { Tag, TagGroup } from "components";

export default {
  title: "TagGroup",
  parameters: {
    info: { inline: true },
  },
  decorators: [
    (Story: Story) => (
      <DndProvider backend={HTML5Backend}>
        <Story />
      </DndProvider>
    ),
  ],
};

export const ShortTagGroup = () => {
  return (
    <TagGroup>
      <Tag
        propId="0"
        entityClass={Entities["R"].entityClass}
        label="R entity label"
      />
      <Tag
        propId="1"
        entityClass={Entities["O"].entityClass}
        label="O entity label"
      />
      <Tag
        propId="2"
        entityClass={Entities["S"].entityClass}
        label="S entity label"
      />
      <Tag
        propId="3"
        entityClass={Entities["E"].entityClass}
        label="E entity label"
      />
    </TagGroup>
  );
};
export const OversizedShortTagGroup = () => {
  return (
    <TagGroup>
      <Tag
        propId="0"
        entityClass={Entities["R"].entityClass}
        label="R entity label"
      />
      <Tag
        propId="1"
        entityClass={Entities["O"].entityClass}
        label="O entity label"
      />
      <Tag
        propId="2"
        entityClass={Entities["S"].entityClass}
        label="S entity label"
      />
      <Tag
        propId="3"
        entityClass={Entities["E"].entityClass}
        label="E entity label"
      />
      <Tag
        propId="4"
        entityClass={Entities["S"].entityClass}
        label="S entity label"
      />
    </TagGroup>
  );
};
