import { EntityEnums } from "@shared/enums";
import { Button } from "components/basic/Button/Button";

import React from "react";
import { FaX } from "react-icons/fa6";
import { styled } from "styled-components";
import theme from "Theme/theme";

interface LanguageTagProps {
  languageValue: EntityEnums.Language;
  onUnlink?: () => void;
}
export const LanguageTag: React.FC<LanguageTagProps> = ({
  languageValue,
  onUnlink,
}) => {
  return (
    <StyledLanguageTag>
      {languageValue.toString()}
      {onUnlink && (
        <Button
          key="d"
          tooltipLabel={"remove language"}
          icon={<FaX size={10} />}
          color={"blue"}
          noBorder
          noBackground
          inverted
          onClick={onUnlink}
        />
      )}
    </StyledLanguageTag>
  );
};

const StyledLanguageTag = styled.div`
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[2]}`};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.fontSize.xxs};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  background-color: ${theme.color.blue["200"]};
  color: ${theme.color.gray["900"]};
`;
