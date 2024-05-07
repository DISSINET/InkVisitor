import {
  FloatingPortal,
  autoUpdate,
  offset,
  useFloating,
} from "@floating-ui/react";
import { config, useSpring } from "@react-spring/web";
import React, { ReactNode, useState } from "react";
import {
  StyledCgMenuBoxed,
  StyledContextBtnGroup,
  StyledWrapper,
} from "./StatementListContextMenuStyles";

interface StatementListContextMenu {
  buttons: ReactNode[];
  inverted?: boolean;
}
export const StatementListContextMenu: React.FC<StatementListContextMenu> = ({
  buttons,
  inverted,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const animatedMount = useSpring({
    opacity: showMenu ? 1 : 0,
    config: config.stiff,
  });

  const { refs, floatingStyles } = useFloating({
    placement: "left",
    whileElementsMounted: autoUpdate,
  });

  return (
    <>
      <StyledWrapper
        ref={refs.setReference}
        onMouseEnter={() => {
          setShowMenu(true);
        }}
        onMouseLeave={() => {
          setShowMenu(false);
        }}
      >
        <StyledCgMenuBoxed
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          $inverted={inverted}
          size={18}
        />
        {showMenu && (
          <FloatingPortal id="page">
            <div
              ref={refs.setFloating}
              style={{
                ...floatingStyles,
              }}
            >
              <StyledContextBtnGroup
                style={animatedMount}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  setShowMenu(false);
                }}
              >
                {buttons}
              </StyledContextBtnGroup>
            </div>
          </FloatingPortal>
        )}
      </StyledWrapper>
    </>
  );
};
