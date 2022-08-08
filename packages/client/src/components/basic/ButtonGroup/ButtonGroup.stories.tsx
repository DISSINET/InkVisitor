import * as React from "react";
import { Button, ButtonGroup } from "components";
import { FaClone, FaInfo, FaPencilAlt, FaTrashAlt } from "react-icons/fa";

export default {
  title: "ButtonGroup",
  parameters: {
    info: { inline: true },
  },
  args: {
    noMargin: false,
  },
};

export const DefaultButtonGroup = ({ ...args }) => {
  return (
    <ButtonGroup {...args}>
      <Button label="button 1" color="primary" />
      <Button label="button 2" color="warning" />
      <Button label="button 3" color="danger" />
      <Button label="button 4" color="info" />
    </ButtonGroup>
  );
};

export const IconButtonGroup = ({ ...args }) => {
  return (
    <ButtonGroup {...args}>
      <Button key="i" icon={<FaInfo size={14} />} color="info" />
      <Button key="d" icon={<FaClone size={14} />} color="success" />
      <Button key="e" icon={<FaPencilAlt size={14} />} color="warning" />
      <Button key="r" icon={<FaTrashAlt size={14} />} color="danger" />
    </ButtonGroup>
  );
};
