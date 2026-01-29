import {
  autoUpdate,
  FloatingPortal,
  offset,
  useFloating,
} from "@floating-ui/react";
import { EntityEnums } from "@shared/enums";
import { IRequestSearch } from "@shared/types/request-search";
import { Button, ButtonGroup } from "components";
import React, { useEffect, useRef, useState } from "react";
import { CgOptions, CgPlayListAdd, CgPlayListRemove } from "react-icons/cg";
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

  const renderBatchButtons = () => {
    return (
      <ButtonGroup $noMarginRight>
        <Button
          inverted
          noBackground
          noBorder
          noPadding
          icon={<CgPlayListAdd size={20} />}
          size={ButtonSize.Small}
          onClick={() => {
            setExpandedOptions([...advancedOptions]);
          }}
          tooltipLabel="Add All"
          disabled={expandedOptions.length === advancedOptions.length}
        />
        <Button
          inverted
          noBackground
          noBorder
          noPadding
          icon={<CgPlayListRemove size={20} />}
          size={ButtonSize.Small}
          onClick={() => {
            setExpandedOptions([]);
            setSearchData({
              labelOrId: searchData.labelOrId,
            });
            setClassOption(defaultClassOption.value as EntityEnums.Class);
          }}
          tooltipLabel="Clear All"
          disabled={expandedOptions.length === 0}
        />
      </ButtonGroup>
    );
  };

  return (
    <>
      <StyledAdvancedOptions
        ref={bubblesRefs.setReference}
        onMouseEnter={handleBubblesMouseEnter}
        onMouseLeave={handleBubblesMouseLeave}
      >
        <StyledAdvancedOptionsSign>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "1.4rem",
            }}
          >
            <CgOptions size={12} />
          </div>
          <i>advanced options</i>
        </StyledAdvancedOptionsSign>
        {renderBatchButtons()}
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
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  {renderBatchButtons()}
                </div>
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
