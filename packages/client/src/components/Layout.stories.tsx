import * as React from "react";
import { Entities } from "types";

import {
  Box,
  Button,
  ButtonSet,
  Input,
  Suggester,
  Tag,
  Tree,
} from "components";

export default {
  title: "Layout",
  parameters: {
    info: { inline: true },
  },
};

export const Layout1 = () => {
  return (
    <div>
      <Button label="danger" color="danger" />
      <Tag
        entity={Entities["R"]}
        label="entity label"
        button={<Button label="x" color="danger" />}
      />
      <Box label="default box" width={400} height={400}>
        {<div>box content</div>}
      </Box>
    </div>
  );
};
