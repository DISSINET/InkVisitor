import * as React from "react";
import { DropDown } from "components";
import { useState } from "react";
import { OptionTypeBase, ValueType } from "react-select";

export default {
  title: "DropDown",
  parameters: {
    info: { inline: true },
  },
};

const items = [
  { value: 0, label: "first option" },
  { value: 1, label: "second option" },
  { value: 2, label: "third option" },
];
export const DefaultDropdown = () => {
  const [selectedItem, setSelectedItem] = useState<ValueType<OptionTypeBase>>();

  return (
    <DropDown
      value={selectedItem}
      onChange={(selectedItem: ValueType<OptionTypeBase>) =>
        setSelectedItem(selectedItem)
      }
      options={items}
    />
  );
};
