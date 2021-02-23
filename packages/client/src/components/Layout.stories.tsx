import * as React from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

import { Entities } from "types";
import { Box, Button, ButtonSet, Input, Suggester, Tag } from "components";

export default {
  title: "Layout",
  parameters: {
    info: { inline: true },
  },
};

export const Layout1 = () => {
  return (
    <DndProvider backend={HTML5Backend}>
      <Button label="danger" color="danger" />
      <Tag
        category={Entities["T"].id}
        color={Entities["T"].color}
        label="entity label"
        button={<Button label="x" color="danger" />}
      />
      <Tag
        category={Entities["T"].id}
        color={Entities["T"].color}
        label="selected entity label"
        invertedLabel
        button={<Button label="x" color="danger" />}
      />
      <Input value="default input" onChangeFn={() => {}} />
      <Box label="default box" width={400} height={400}>
        {<div>box content</div>}
      </Box>
    </DndProvider>
  );
};
