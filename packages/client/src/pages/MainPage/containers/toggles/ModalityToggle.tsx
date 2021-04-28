import React from "react";
import { IoMdChatbubbles } from "react-icons/io";

import { Toggle, Dropdown } from "components";

import styled from "styled-components";

import { modalityDict } from "./../../../../../../shared/dictionaries";
import { IOption } from "./../../../../../../shared/types";

interface IModalityToggle {
  onChangeFn: Function;
  value: string;
}

export const ModalityToggle: React.FC<IModalityToggle> = ({
  onChangeFn,
  value,
}) => {
  const items = modalityDict.map((i) => {
    return {
      value: i.value,
      label: i.label,
      tooltip: i.label,
    };
  });

  return (
    <Dropdown
      options={items}
      value={items.find((i) => i.value === value)}
      onChange={(newValue: any) => {
        onChangeFn(newValue.value);
      }}
      formatOptionLabel={(option: any, optionProps: any) => {
        return optionProps.context === "menu" ? (
          <StyledModalityContentSpan>{option.label}</StyledModalityContentSpan>
        ) : (
          <StyledModalityContentSpan>
            <IoMdChatbubbles />
            {option.value}
          </StyledModalityContentSpan>
        );
      }}
      width={60}
      menuWidth={200}
      noDropDownIndicator
    />
    // <Toggle
    //   icon={<IoMdChatbubbles />}
    //   inverted
    //   onChangeFn={(newValue) => {
    //     onChangeFn(newValue.value);
    //   }}
    //   optionList={items}
    //   selectedValue={value}
    // />
  );
};

const StyledModalityContentSpan = styled.span`
  svg {
    vertical-align: middle;
    margin-right: 4px;
  }
`;
