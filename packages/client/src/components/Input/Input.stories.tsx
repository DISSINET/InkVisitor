import * as React from "react";
import { Input } from "components";

export default {
  title: "Input",
  parameters: {
    info: { inline: true },
  },
};

const onChangeFn = () => {};

export const DefaultInput = () => {
  return <Input value="default input" onChangeFn={onChangeFn} />;
};

export const TextWithLabel = () => {
  return (
    <Input
      type="text"
      value="default input"
      label="label"
      onChangeFn={onChangeFn}
    />
  );
};

export const TextInverted = () => {
  return (
    <Input
      type="text"
      value="inverted input"
      label="inverted"
      inverted
      onChangeFn={onChangeFn}
    />
  );
};

export const Select = () => {
  return (
    <Input
      type="select"
      value=""
      label="select"
      options={[
        {
          value: "1",
          label: "option 1",
        },
        {
          value: "2",
          label: "option 2",
        },
      ]}
      onChangeFn={onChangeFn}
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
      onChangeFn={onChangeFn}
    />
  );
};
