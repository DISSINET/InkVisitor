import * as React from "react";
import { Button, ButtonGroup } from "components";
import { FaClone, FaInfo, FaPencilAlt, FaTrashAlt } from "react-icons/fa";

export default {
  title: "ButtonGroup",
  parameters: {
    info: { inline: true },
  },
};

export const DefaultButtonGroup = () => {
  return (
    <ButtonGroup>
      <Button label="button 1" color="primary" />
      <Button label="button 2" color="warning" />
      <Button label="button 3" color="danger" />
      <Button label="button 4" color="info" />
    </ButtonGroup>
  );
};
export const ButtonGroupNoMargin = () => {
  return (
    <ButtonGroup noMargin>
      <Button label="button 1" color="primary" />
      <Button label="button 2" color="warning" />
      <Button label="button 3" color="danger" />
      <Button label="button 4" color="info" />
    </ButtonGroup>
  );
};

export const IconButtonGroup = () => {
  return (
    <ButtonGroup>
      <Button key="i" icon={<FaInfo size={14} />} color="info" />
      <Button key="d" icon={<FaClone size={14} />} color="success" />
      <Button key="e" icon={<FaPencilAlt size={14} />} color="warning" />
      <Button key="r" icon={<FaTrashAlt size={14} />} color="danger" />
    </ButtonGroup>
  );
};

export const IconButtonGroupNoMargin = () => {
  return (
    <ButtonGroup noMargin>
      <Button key="i" icon={<FaInfo size={14} />} color="info" />
      <Button key="d" icon={<FaClone size={14} />} color="success" />
      <Button key="e" icon={<FaPencilAlt size={14} />} color="warning" />
      <Button key="r" icon={<FaTrashAlt size={14} />} color="danger" />
    </ButtonGroup>
  );
};
