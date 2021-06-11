import * as React from "react";
import { Box } from "components";

export default {
  title: "Box",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultBox = () => {
  return (
    <Box label="Default Box" height={400}>
      {<div>box content</div>}
    </Box>
  );
};

export const WarningBox = () => {
  return (
    <Box label="warning box" height={400} color="warning">
      {<div>warning box content</div>}
    </Box>
  );
};
