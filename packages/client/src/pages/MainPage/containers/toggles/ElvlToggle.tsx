import { Dropdown } from "components";
import React, { useMemo } from "react";
import { FaBook } from "react-icons/fa";
import styled from "styled-components";
import { elvlDict } from "./../../../../../../shared/dictionaries";

interface IElvlToggle {
  onChangeFn: Function;
  value: string;
}

export const ElvlToggle: React.FC<IElvlToggle> = ({ onChangeFn, value }) => {
  const items = elvlDict.map((i) => {
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
            <FaBook />
            {option.value}
          </StyledModalityContentSpan>
        );
      }}
      width={40}
      menuWidth={100}
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
