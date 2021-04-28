import React, { useMemo } from "react";
import { IoMdChatbubbles } from "react-icons/io";

import { Dropdown } from "components";

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

  const selectedItem = useMemo(() => {
    return items.find((i) => i.value === value);
  }, [value]);

  return (
    <Dropdown
      label={selectedItem?.label}
      options={items}
      value={selectedItem}
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
  );
};

const StyledModalityContentSpan = styled.span`
  svg {
    vertical-align: middle;
    margin-right: 4px;
  }
`;
