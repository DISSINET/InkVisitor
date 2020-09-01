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
  return <Tag category={Entities["T"].id} color={Entities["T"].color} />;
};

export const TagWithLabel = () => {
  return (
    <Tag
      category={Entities["R"].id}
      color={Entities["R"].color}
      label="entity label"
    />
  );
};

export const TagWithLabelAndButton = () => {
  return (
    <Tag
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
      category={Entities["P"].id}
      color={Entities["P"].color}
      label="entity label entity label entity label"
      button={<Button label="x" color="danger" />}
    />
  );
};
