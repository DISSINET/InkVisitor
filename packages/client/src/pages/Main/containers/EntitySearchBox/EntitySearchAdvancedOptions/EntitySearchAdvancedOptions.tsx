import {
  autoUpdate,
  FloatingPortal,
  offset,
  useFloating,
} from "@floating-ui/react";
import { Button } from "components";
import React, { useEffect, useRef, useState } from "react";
import { BiSelectMultiple } from "react-icons/bi";
import { CgOptions } from "react-icons/cg";
import { MdFilterNone } from "react-icons/md";
import { animated, config, useSpring } from "react-spring";
import { ButtonSize } from "types";
import {
  StyledAdvancedOptions,
  StyledAdvancedOptionsSign,
  StyledButtonsContainer,
  StyledFloatingContainer,
  StyledPill,
  StyledPillLabel,
  StyledPillsContainer,
} from "../EntitySearchBoxStyles";
import { IRequestSearch } from "@shared/types/request-search";
import { EntityEnums } from "@shared/enums";

const advancedOptions = [
  "class",
  "status",
  "language",
  "territory",
  "co-occurrence",
  "referenced to",
  "created at",
  "udpated at",
  "created by",
  "updated by",
  "edited by",
  "root validity",
];
interface EntitySearchAdvancedOptions {
  expandedOptions: string[];
  setExpandedOptions: (options: string[]) => void;
  searchData: IRequestSearch;
  setSearchData: (data: IRequestSearch) => void;
  classOption: EntityEnums.Class;
  setClassOption: (option: EntityEnums.Class) => void;
  defaultClassOption: {
    label: string;
    value: EntityEnums.Class;
  };
}
export const EntitySearchAdvancedOptions: React.FC<
  EntitySearchAdvancedOptions
> = ({
  expandedOptions,
  setExpandedOptions,
  searchData,
  setSearchData,
  classOption,
  setClassOption,
  defaultClassOption,
}) => {
  const [showBubblesMenu, setShowBubblesMenu] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);
  const unmountTimeoutRef = useRef<number | null>(null);

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current !== null) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const clearUnmountTimeout = () => {
    if (unmountTimeoutRef.current !== null) {
      clearTimeout(unmountTimeoutRef.current);
      unmountTimeoutRef.current = null;
    }
  };

  const handleBubblesMouseEnter = () => {
    clearHideTimeout();
    clearUnmountTimeout();
    setPortalMounted(true);
    setShowBubblesMenu(true);
  };

  const handleBubblesMouseLeave = () => {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => {
      setShowBubblesMenu(false);
      hideTimeoutRef.current = null;
    }, 400);
  };

  useEffect(() => {
    if (!showBubblesMenu && portalMounted) {
      clearUnmountTimeout();
      unmountTimeoutRef.current = window.setTimeout(() => {
        setPortalMounted(false);
        unmountTimeoutRef.current = null;
      }, 500);
      return () => {
        clearUnmountTimeout();
      };
    }
  }, [showBubblesMenu, portalMounted]);

  useEffect(() => {
    return () => {
      clearHideTimeout();
      clearUnmountTimeout();
    };
  }, []);

  const animatedBubblesMount = useSpring({
    opacity: showBubblesMenu ? 1 : 0,
    config: config.stiff,
  });

  const { refs: bubblesRefs, floatingStyles: bubblesFloatingStyles } =
    useFloating({
      placement: "left",
      whileElementsMounted: autoUpdate,
      middleware: [offset({ mainAxis: 4 })],
    });

  return (
    <>
      <StyledAdvancedOptions
        ref={bubblesRefs.setReference}
        onMouseEnter={handleBubblesMouseEnter}
        onMouseLeave={handleBubblesMouseLeave}
      >
        <StyledAdvancedOptionsSign>
          <CgOptions size={12} />
          <i>advanced options</i>
        </StyledAdvancedOptionsSign>
      </StyledAdvancedOptions>

      {portalMounted && (
        <FloatingPortal id="page">
          <div
            ref={bubblesRefs.setFloating}
            style={{
              ...bubblesFloatingStyles,
              zIndex: 1000,
              maxWidth: "250px",
              pointerEvents: "auto",
            }}
            onMouseEnter={handleBubblesMouseEnter}
            onMouseLeave={handleBubblesMouseLeave}
          >
            <animated.div
              style={{
                ...animatedBubblesMount,
                pointerEvents: showBubblesMenu ? "auto" : "none",
              }}
            >
              <StyledFloatingContainer>
                <StyledButtonsContainer>
                  <Button
                    inverted
                    noBackground
                    noBorder
                    noPadding
                    icon={<BiSelectMultiple size={20} />}
                    size={ButtonSize.Small}
                    onClick={() => {
                      setExpandedOptions([...advancedOptions]);
                    }}
                    tooltipLabel="Select All"
                  />
                  <Button
                    inverted
                    noBackground
                    noBorder
                    noPadding
                    icon={<MdFilterNone size={17} />}
                    size={ButtonSize.Small}
                    onClick={() => {
                      setExpandedOptions([]);
                      setSearchData({
                        labelOrId: searchData.labelOrId,
                      });
                      setClassOption(
                        defaultClassOption.value as EntityEnums.Class
                      );
                    }}
                    tooltipLabel="Deselect All"
                  />
                </StyledButtonsContainer>
                <StyledPillsContainer>
                  {advancedOptions.map((option) => {
                    const isSelected = expandedOptions.includes(option);
                    return (
                      <StyledPill
                        key={option}
                        $selected={isSelected}
                        onClick={() => {
                          if (isSelected) {
                            setExpandedOptions(
                              expandedOptions.filter((o) => o !== option)
                            );
                          } else {
                            setExpandedOptions([...expandedOptions, option]);
                          }
                        }}
                      >
                        <StyledPillLabel>{option}</StyledPillLabel>
                      </StyledPill>
                    );
                  })}
                </StyledPillsContainer>
              </StyledFloatingContainer>
            </animated.div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
