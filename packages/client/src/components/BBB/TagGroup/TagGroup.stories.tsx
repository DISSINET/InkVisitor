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
        category={Entities["R"].id}
        color={Entities["R"].color}
        label="R entity label"
        short
      />
      <Tag
        propId="1"
        category={Entities["O"].id}
        color={Entities["O"].color}
        label="O entity label"
        short
      />
      <Tag
        propId="2"
        category={Entities["S"].id}
        color={Entities["S"].color}
        label="S entity label"
        short
      />
      <Tag
        propId="3"
        category={Entities["E"].id}
        color={Entities["E"].color}
        label="E entity label"
        short
      />
    </TagGroup>
  );
};
export const OversizedShortTagGroup = () => {
  return (
    <TagGroup>
      <Tag
        propId="0"
        category={Entities["R"].id}
        color={Entities["R"].color}
        label="R entity label"
        short
      />
      <Tag
        propId="1"
        category={Entities["O"].id}
        color={Entities["O"].color}
        label="O entity label"
        short
      />
      <Tag
        propId="2"
        category={Entities["S"].id}
        color={Entities["S"].color}
        label="S entity label"
        short
      />
      <Tag
        propId="3"
        category={Entities["E"].id}
        color={Entities["E"].color}
        label="E entity label"
        short
      />
      <Tag
        propId="4"
        category={Entities["S"].id}
        color={Entities["S"].color}
        label="S entity label"
        short
      />
    </TagGroup>
  );
};
