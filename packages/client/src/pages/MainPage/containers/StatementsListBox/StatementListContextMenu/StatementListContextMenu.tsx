import React, { ReactNode, useRef, useState } from "react";
import { config, Transition } from "react-spring/renderprops";

import {
  StyledContextButtonGroup,
  StyledFaChevronCircleDown,
  StyledWrapper,
} from "./StatementListContextMenuStyles";

interface StatementListContextMenu {
  buttons: ReactNode[];
}
export const StatementListContextMenu: React.FC<StatementListContextMenu> = ({
  buttons,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({
    x: 0,
    y: 0,
    height: 0,
  });

  const setDivPosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCurrentPosition({
        x: rect["x"],
        y: rect["y"],
        height: rect["height"],
      });
    }
  };

  return (
    <>
      <StyledWrapper
        ref={ref}
        onMouseEnter={() => {
          if (!showMenu) {
            setDivPosition();
          }
          // onMenuOpen();
          setShowMenu(true);
        }}
        onMouseLeave={() => {
          // onMenuClose();
          setShowMenu(false);
        }}
      >
        <StyledFaChevronCircleDown size={14} />
        <Transition
          items={showMenu}
          from={{ opacity: 0 }}
          enter={{ opacity: 1 }}
          leave={{ opacity: 0 }}
          config={config.stiff}
        >
          {(showMenu) =>
            showMenu &&
            ((styles) => (
              <StyledContextButtonGroup
                $clientX={currentPosition.x}
                $clientY={currentPosition.y}
                height={currentPosition.height}
                style={styles}
              >
                {buttons}
              </StyledContextButtonGroup>
            ))
          }
        </Transition>
      </StyledWrapper>
    </>
  );
};
