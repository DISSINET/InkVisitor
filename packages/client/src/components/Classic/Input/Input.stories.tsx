import * as React from "react";
import { Input } from "components";
import { useState } from "react";

export default {
  title: "Input",
  parameters: {
    info: { inline: true },
  },
  args: {
    inverted: false,
  },
};

const onChangeFn = () => {};

export const DefaultInput = ({ ...args }) => {
  const [value, setValue] = useState("Default Input");
  return (
    <Input
      {...args}
      value={value}
      onChangeFn={(value: string) => setValue(value)}
    />
  );
};

export const TextWithLabel = ({ ...args }) => {
  const [value, setValue] = useState("Input text");
  return (
    <Input
      {...args}
      value={value}
      label="label"
      onChangeFn={(value: string) => setValue(value)}
    />
  );
};

export const Select = ({ ...args }) => {
  return (
    <Input
      {...args}
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

export const Textarea = ({ ...args }) => {
  const [value, setValue] = useState(
    "I believe that space travel will one day become as common as airline travel is today. I’m convinced, however, that the true future of space travel does not lie with government agencies — NASA is still obsessed with the idea that the primary purpose of the space program is science — but real progress will come from private companies competing to provide the ultimate adventure ride, and NASA will receive the trickle-down benefits."
  );
  return (
    <Input
      {...args}
      type="textarea"
      value={value}
      label="textarea"
      rows={10}
      cols={30}
      onChangeFn={(value: string) => setValue(value)}
    />
  );
};
