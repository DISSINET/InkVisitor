import * as React from "react";
import { Tag, Button } from "components";

import { Entities } from "types";

export default {
  title: "Tag",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultTag = () => {
  return <Tag entity={Entities["T"]} />;
};

export const TagWithLabel = () => {
  return <Tag entity={Entities["R"]} label="entity label" />;
};

export const TagWithLabelAndButton = () => {
  return (
    <Tag
      entity={Entities["R"]}
      label="entity label"
      button={<Button label="x" color="danger" />}
    />
  );
};

export const TagWithVeryLongLabel = () => {
  return (
    <Tag
      entity={Entities["R"]}
      label="entity label entity label entity label"
      button={<Button label="x" color="danger" />}
    />
  );
};
