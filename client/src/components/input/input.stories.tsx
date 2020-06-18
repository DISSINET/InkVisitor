import * as React from "react";
import { Input } from "./input";

export default {
  title: "Input",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultInput = () => {
  return <Input value="default input" />;
};

export const TextWithLabel = () => {
  return <Input type="text" value="default input" label="label" />;
};

export const TextInverted = () => {
  return <Input type="text" value="inverted input" label="inverted" inverted />;
};

export const Select = () => {
  return (
    <Input
      type="select"
      value=""
      label="select"
      options={["option1", "option2"]}
    />
  );
};

export const Textarea = () => {
  return (
    <Input
      type="textarea"
      value="long text long text long text long text long text long text "
      label="textarea"
      rows={10}
      cols={10}
    />
  );
};
