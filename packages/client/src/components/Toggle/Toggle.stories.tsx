import * as React from "react";
import { Toggle } from "components";
import { FaInfo, FaPencilAlt, FaTrashAlt } from "react-icons/fa";
import { useState } from "react";
import { ToggleItem } from "types";

export default {
  title: "Toggle",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultToggle = () => {
  const options = [
    { value: "0", label: "Neverending text about something" },
    { value: "1", label: "InkVisitor" },
    { value: "2", label: "Development" },
  ];
  const [toggleItem, setToggleItem] = useState<ToggleItem>(options[0]);

  return (
    <>
      <Toggle
        optionList={options}
        selectedValue={toggleItem.value}
        onChangeFn={(item: ToggleItem) => setToggleItem(item)}
      />
      <h6>value: {toggleItem?.value}</h6>
      <h6>label: {toggleItem?.label}</h6>
    </>
  );
};
export const DefaultIconToggle = () => {
  const options = [
    { value: "0", label: <FaPencilAlt /> },
    { value: "1", label: <FaTrashAlt /> },
    { value: "2", label: <FaInfo /> },
  ];
  const [toggleItem, setToggleItem] = useState<ToggleItem>(options[0]);

  return (
    <>
      <Toggle
        optionList={options}
        selectedValue={toggleItem.value}
        onChangeFn={(item: ToggleItem) => setToggleItem(item)}
        color="danger"
        inverted
      />
      <h6>{toggleItem?.value}</h6>
      <h6>{toggleItem?.label}</h6>
    </>
  );
};

export const LongToggleWithValueOutside = () => {
  const options = [
    { value: "0", label: "This text is too long to handle" },
    { value: "1", label: "Another long which is too long to handle" },
    { value: "2", label: "Masarykova" },
    { value: "3", label: "Univerzita" },
  ];
  const [toggleItem, setToggleItem] = useState<ToggleItem>(options[0]);
  return (
    <>
      <div>
        <Toggle
          optionList={options}
          selectedValue={toggleItem.value}
          color="danger"
          onChangeFn={(item: ToggleItem) => setToggleItem(item)}
        />
      </div>
      <h6>{toggleItem?.value}</h6>
      <h6>{toggleItem?.label}</h6>
    </>
  );
};
