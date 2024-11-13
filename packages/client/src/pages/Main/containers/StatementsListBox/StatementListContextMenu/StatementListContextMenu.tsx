import { FloatingPortal, autoUpdate, useFloating } from "@floating-ui/react";
import { config, useSpring } from "@react-spring/web";
import React, { ReactNode, useEffect, useState } from "react";
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
  const [timeoutId, setTimeoutId] = useState<number | null>(null);

  const handleMouseEnter = () => {
    setPortalMounted(true);
    setShowMenu(true);
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
  };

  const handleMouseLeave = () => {
    const id = window.setTimeout(() => {
      setShowMenu(false);
    }, 150);

    setTimeoutId(id);
  };

  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => {
    if (!showMenu && portalMounted) {
      setTimeout(() => {
        setPortalMounted(false);
      }, 300);
    }
  }, [showMenu]);

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
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <StyledCgMenuBoxed
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          $inverted={inverted}
          size={22}
        />
        {portalMounted && (
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
