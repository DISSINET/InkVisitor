import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Entities } from "types";
import { Tag, TagGroup } from "components";

export default {
  title: "TagGroup",
  parameters: {
    info: { inline: true },
  },
};

export const ShortTagGroup = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TagGroup>
        <Tag
          category={Entities["R"].id}
          color={Entities["R"].color}
          label="R entity label"
          short
        />
        <Tag
          category={Entities["O"].id}
          color={Entities["O"].color}
          label="O entity label"
          short
        />
        <Tag
          category={Entities["S"].id}
          color={Entities["S"].color}
          label="S entity label"
          short
        />
        <Tag
          category={Entities["E"].id}
          color={Entities["E"].color}
          label="E entity label"
          short
        />
      </TagGroup>
    </DndProvider>
  );
};
export const OversizedShortTagGroup = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <TagGroup>
        <Tag
          category={Entities["R"].id}
          color={Entities["R"].color}
          label="R entity label"
          short
        />
        <Tag
          category={Entities["O"].id}
          color={Entities["O"].color}
          label="O entity label"
          short
        />
        <Tag
          category={Entities["S"].id}
          color={Entities["S"].color}
          label="S entity label"
          short
        />
        <Tag
          category={Entities["E"].id}
          color={Entities["E"].color}
          label="E entity label"
          short
        />
        <Tag
          category={Entities["S"].id}
          color={Entities["S"].color}
          label="S entity label"
          short
        />
      </TagGroup>
    </DndProvider>
  );
};
