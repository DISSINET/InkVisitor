import * as React from "react";
import { Box, Button } from "components";

export default {
  title: "Box",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultBox = () => {
  return (
    <Box label="default box" width={400} height={400}>
      {<div>box content</div>}
    </Box>
  );
};

export const WarningBox = () => {
  return (
    <Box label="warning box" width={400} height={400} color="warning">
      {<div>warning box content</div>}
    </Box>
  );
};
