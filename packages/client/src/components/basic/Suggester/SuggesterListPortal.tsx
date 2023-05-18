import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { StyledRelativePosition, StyledSuggesterList } from "./SuggesterStyles";
import { SuggesterKeyPress } from "./SuggesterKeyPress";
import { Loader } from "components";
import { EntitySuggestion, DropdownItem } from "types";

interface SuggesterListPortal {
  position: any;
  setIsHovered: React.Dispatch<React.SetStateAction<boolean>>;
  selected: number;
  setSelected: React.Dispatch<React.SetStateAction<number>>;
  renderEntitySuggestions: () => JSX.Element;
  suggestions: EntitySuggestion[];
  categories: DropdownItem[];
  isFetching: boolean | undefined;
  targetElement: React.RefObject<HTMLDivElement>;
}
export const SuggesterListPortal: React.FC<SuggesterListPortal> = ({
  position,
  setIsHovered,
  renderEntitySuggestions,
  selected,
  setSelected,
  suggestions,
  categories,
  isFetching,
  targetElement,
}) => {
  return (
    <>
      {position &&
        ReactDOM.createPortal(
          <StyledSuggesterList
            noLeftMargin={categories.length === 1}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              position: "fixed",
              left: position.x,
              top: position.y,
            }}
          >
            <StyledRelativePosition>
              {renderEntitySuggestions()}
              <Loader size={30} show={isFetching} />
            </StyledRelativePosition>
            <SuggesterKeyPress
              onArrowDown={() => {
                if (selected < suggestions.length - 1)
                  setSelected(selected + 1);
              }}
              onArrowUp={() => {
                if (selected > -1) setSelected(selected - 1);
              }}
              dependencyArr={[selected]}
            />
          </StyledSuggesterList>,
          document.getElementById("page")!
        )}
    </>
  );
};
