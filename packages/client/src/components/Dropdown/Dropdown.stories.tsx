import * as React from "react";
import { Dropdown } from "components";
import { useState } from "react";
import { OptionTypeBase, ValueType } from "react-select";

export default {
  title: "Dropdown",
  parameters: {
    info: { inline: true },
  },
  args: {
    hideSelectedOptions: false,
    noDropDownIndicator: false,
    isClearable: false,
    isMulti: false,
  },
};

const items = [
  { value: 0, label: "first option" },
  { value: 1, label: "second option" },
  { value: 2, label: "third option" },
];
export const DefaultDropdownFullWidth = ({ ...args }) => {
  const [selectedItem, setSelectedItem] = useState<
    ValueType<OptionTypeBase, any>
  >();
  return (
    <Dropdown
      {...args}
      value={selectedItem}
      onChange={(selectedItem: ValueType<OptionTypeBase, any>) =>
        setSelectedItem(selectedItem)
      }
      options={items}
      width="full"
    />
  );
};

export const DropdownNarrower = ({ ...args }) => {
  const [selectedItem, setSelectedItem] = useState<
    ValueType<OptionTypeBase, any>
  >();
  return (
    <Dropdown
      {...args}
      value={selectedItem}
      onChange={(selectedItem: ValueType<OptionTypeBase, any>) =>
        setSelectedItem(selectedItem)
      }
      options={items}
      width={180}
    />
  );
};
