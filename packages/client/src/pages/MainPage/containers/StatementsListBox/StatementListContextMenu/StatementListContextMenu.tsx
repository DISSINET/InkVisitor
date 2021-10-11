import React, { ReactNode, useRef, useState } from "react";
import { config, Transition } from "react-spring/renderprops";
import { useAppSelector } from "redux/hooks";

import {
  StyledCgMenuBoxed,
  StyledContextButtonGroup,
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
  const firstPanelExpanded: boolean = useAppSelector(
    (state) => state.layout.firstPanelExpanded
  );
  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );
  const ref = useRef<HTMLDivElement>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [currentPosition, setCurrentPosition] = useState({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
  });

  const setDivPosition = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCurrentPosition({
        x: rect["x"],
        y: rect["y"],
        height: rect["height"],
        width: rect["width"],
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
          setShowMenu(true);
        }}
        onMouseLeave={() => {
          setShowMenu(false);
        }}
        onClick={() => setShowMenu(false)}
      >
        <StyledCgMenuBoxed $inverted={inverted} size={18} />

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
                style={styles}
                $firstPanelExpanded={firstPanelExpanded}
                $panelWidths={panelWidths}
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
