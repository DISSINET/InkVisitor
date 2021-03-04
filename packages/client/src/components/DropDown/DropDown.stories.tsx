import * as React from "react";
import { Dropdown } from "components";
import { useState } from "react";
import { OptionTypeBase, ValueType } from "react-select";

export default {
  title: "Dropdown",
  parameters: {
    info: { inline: true },
  },
};

const items = [
  { value: 0, label: "first option" },
  { value: 1, label: "second option" },
  { value: 2, label: "third option" },
];
export const DefaultDropdownFullWidth = () => {
  const [selectedItem, setSelectedItem] = useState<ValueType<OptionTypeBase>>();
  return (
    <Dropdown
      value={selectedItem}
      onChange={(selectedItem: ValueType<OptionTypeBase>) =>
        setSelectedItem(selectedItem)
      }
      options={items}
    />
  );
};

export const DropdownNarrower = () => {
  const [selectedItem, setSelectedItem] = useState<ValueType<OptionTypeBase>>();
  return (
    <Dropdown
      value={selectedItem}
      onChange={(selectedItem: ValueType<OptionTypeBase>) =>
        setSelectedItem(selectedItem)
      }
      options={items}
      width={180}
    />
  );
};
