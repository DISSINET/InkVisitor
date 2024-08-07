import React, { useContext } from "react";
import { useMemo } from "react";
import {
  BsCaretDownFill,
  BsCaretRightFill,
  BsCaretRight,
  BsCaretDown,
} from "react-icons/bs";

import { StyledFaCircle, StyledFaDotCircle } from "./TerritoryTreeNodeStyles";
import { InterfaceEnums, UserEnums } from "@shared/enums";
import { useAppSelector } from "redux/hooks";
import { ThemeContext } from "styled-components";

interface TerritoryTreeNodeArrowIcon {
  territoryId: string;
  isExpanded: boolean;
  empty: boolean;
  hasChildren: boolean;
  statementsCount: number;
  right: UserEnums.RoleMode;
}
const TerritoryTreeNodeArrowIcon: React.FC<TerritoryTreeNodeArrowIcon> = ({
  territoryId,
  isExpanded,
  empty,
  hasChildren,
  statementsCount,
  right,
}) => {
  const selectedThemeId: InterfaceEnums.Theme = useAppSelector(
    (state) => state.theme
  );

  const themeContext = useContext(ThemeContext);

  const symbolColor = useMemo(() => {
    return right === UserEnums.RoleMode.Read
      ? themeContext?.color.treeNodeRead
      : themeContext?.color.treeNodeWrite;
  }, [right, selectedThemeId]);

  const iconStyle: React.CSSProperties = {
    strokeWidth: "2",
    strokeLinejoin: "bevel",
    marginRight: "2px",
  };

  const Icon = useMemo<React.ReactElement>(() => {
    if (hasChildren) {
      if (!empty) {
        // filled
        if (isExpanded) {
          return (
            <BsCaretDownFill size={14} color={symbolColor} style={iconStyle} />
          );
        } else {
          return (
            <BsCaretRightFill size={14} color={symbolColor} style={iconStyle} />
          );
        }
      } else {
        // bordered
        if (isExpanded) {
          return (
            <BsCaretDown size={14} color={symbolColor} style={iconStyle} />
          );
        } else {
          return (
            <BsCaretRight size={14} color={symbolColor} style={iconStyle} />
          );
        }
      }
    } else {
      if (statementsCount > 0) {
        return <StyledFaCircle size={11} color={symbolColor} />;
      } else {
        return <StyledFaDotCircle size={11} color={symbolColor} />;
      }
    }
  }, [
    hasChildren,
    isExpanded,
    empty,
    statementsCount,
    territoryId,
    symbolColor,
  ]);

  return Icon;
};

export default React.memo(TerritoryTreeNodeArrowIcon);
