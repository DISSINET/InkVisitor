import { Tag } from "components";
import React from "react";

interface EmptyTag {
  label: string;
}
export const EmptyTag: React.FC<EmptyTag> = ({ label }) => {
  return <Tag propId={label} label={label} disableTooltip disableDoubleClick />;
};
