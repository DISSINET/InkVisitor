import { autoUpdate, FloatingPortal, offset, useFloating } from "@floating-ui/react";
import { SearchEnums } from "@inkvisitor/shared/enums";
import { IRequestSearch, IRequestSearchRootValidity } from "@inkvisitor/shared/types/request-search";
import { Button, ButtonGroup } from "components";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { CgOptions, CgPlayListAdd, CgPlayListRemove } from "react-icons/cg";
import { LuListTodo } from "react-icons/lu";
import { animated, config, useSpring } from "react-spring";
import { ButtonSize } from "types";
import {
  StyledAdvancedOptions,
  StyledAdvancedOptionsIconWrap,
  StyledAdvancedOptionsSign,
  StyledFloatingActions,
  StyledFloatingContainer,
  StyledFloatingContainerTitle,
  StyledPill,
  StyledPillLabel,
  StyledPillsContainer,
} from "../EntitySearchBoxStyles";

const advancedOptions = SearchEnums.AdvancedOptions;
interface EntitySearchAdvancedOptions {
  expandedOptions: SearchEnums.AdvancedOption[];
  setExpandedOptions: (options: SearchEnums.AdvancedOption[]) => void;
  searchData: IRequestSearch;
  setSearchData: (data: IRequestSearch) => void;
}
export const EntitySearchAdvancedOptions: React.FC<EntitySearchAdvancedOptions> = ({
  expandedOptions,
  setExpandedOptions,
  searchData,
  setSearchData,
}) => {
  const [showPillsMenu, setShowPillsMenu] = useState(false);
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

  const handlePillsMouseEnter = () => {
    clearHideTimeout();
    clearUnmountTimeout();
    setPortalMounted(true);
    setShowPillsMenu(true);
  };

  const handlePillsMouseLeave = () => {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => {
      setShowPillsMenu(false);
      hideTimeoutRef.current = null;
    }, 500);
  };

  useEffect(() => {
    if (!showPillsMenu && portalMounted) {
      clearUnmountTimeout();
      unmountTimeoutRef.current = window.setTimeout(() => {
        setPortalMounted(false);
        unmountTimeoutRef.current = null;
      }, 250);
      return () => {
        clearUnmountTimeout();
      };
    }
  }, [showPillsMenu, portalMounted]);

  useEffect(() => {
    return () => {
      clearHideTimeout();
      clearUnmountTimeout();
    };
  }, []);

  const animatedPillsMount = useSpring({
    opacity: showPillsMenu ? 1 : 0,
    config: config.stiff,
  });

  const { refs: PillsRefs, floatingStyles: PillsFloatingStyles } = useFloating({
    placement: "left",
    whileElementsMounted: autoUpdate,
    middleware: [offset({ mainAxis: 4 })],
  });

  const hasValueForOption = useCallback(
    (option: SearchEnums.AdvancedOption) => {
      switch (option) {
        case SearchEnums.AdvancedOption.Class:
          return Boolean(searchData.class);
        case SearchEnums.AdvancedOption.Status:
          return Boolean(searchData.status);
        case SearchEnums.AdvancedOption.Language:
          return Boolean(searchData.language);
        case SearchEnums.AdvancedOption.Territory:
          return Boolean(searchData.territoryId);
        case SearchEnums.AdvancedOption.CoOccurrence:
          return Boolean(searchData.cooccurrenceId);
        case SearchEnums.AdvancedOption.ReferencedTo:
          return Boolean(searchData.haveReferenceTo);
        case SearchEnums.AdvancedOption.CreatedAt:
          return searchData.createdDate !== undefined;
        case SearchEnums.AdvancedOption.UpdatedAt:
          return searchData.updatedDate !== undefined;
        case SearchEnums.AdvancedOption.CreatedBy:
          return Boolean(searchData.createdBy);
        case SearchEnums.AdvancedOption.UpdatedBy:
          return Boolean(searchData.updatedBy);
        case SearchEnums.AdvancedOption.EditedBy:
          return Boolean(searchData.editedBy);
        case SearchEnums.AdvancedOption.RootValidity:
          return (
            searchData.isRootInvalid !== undefined &&
            searchData.isRootInvalid !== null &&
            searchData.isRootInvalid !== IRequestSearchRootValidity.Any
          );
        default:
          return false;
      }
    },
    [searchData]
  );

  const renderBatchButtons = useCallback(() => {
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
        {/* <Button
          inverted
          noBackground
          noBorder
          noPadding
          icon={<LuListTodo size={17} />}
          size={ButtonSize.Small}
          onClick={() => {
            setExpandedOptions(expandedOptions.filter((option) => hasValueForOption(option)));
          }}
          tooltipLabel="Clear empty filters"
          disabled={expandedOptions.length === 0}
        /> */}
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
          }}
          tooltipLabel="Clear All"
          disabled={expandedOptions.length === 0}
        />
      </ButtonGroup>
    );
  }, [expandedOptions, hasValueForOption, setExpandedOptions, setSearchData, searchData]);

  return (
    <>
      <StyledAdvancedOptions
        ref={PillsRefs.setReference}
        onMouseEnter={handlePillsMouseEnter}
        onMouseLeave={handlePillsMouseLeave}
      >
        <StyledAdvancedOptionsSign>
          <StyledAdvancedOptionsIconWrap>
            <CgOptions size={12} />
          </StyledAdvancedOptionsIconWrap>
          <i>advanced options</i>
        </StyledAdvancedOptionsSign>
        {renderBatchButtons()}
      </StyledAdvancedOptions>

      {portalMounted && (
        <FloatingPortal id="page-content">
          <div
            ref={PillsRefs.setFloating}
            style={{
              ...PillsFloatingStyles,
              zIndex: 1000,
              maxWidth: "250px",
              pointerEvents: "auto",
            }}
            onMouseEnter={handlePillsMouseEnter}
            onMouseLeave={handlePillsMouseLeave}
          >
            <animated.div
              style={{
                ...animatedPillsMount,
                pointerEvents: showPillsMenu ? "auto" : "none",
              }}
            >
              <StyledFloatingContainer>
                <StyledFloatingContainerTitle>Select active filters</StyledFloatingContainerTitle>
                <StyledPillsContainer>
                  {advancedOptions.map((option) => {
                    const isSelected = expandedOptions.includes(option);
                    return (
                      <StyledPill
                        key={option}
                        $selected={isSelected}
                        onClick={() => {
                          if (isSelected) {
                            setExpandedOptions(expandedOptions.filter((o) => o !== option));
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
                <StyledFloatingActions>
                  <Button
                    inverted
                    noBackground
                    noBorder
                    noPadding
                    icon={<LuListTodo size={18} />}
                    size={ButtonSize.Small}
                    onClick={() => {
                      setExpandedOptions(
                        expandedOptions.filter((option) => hasValueForOption(option))
                      );
                    }}
                    tooltipLabel="Clear empty filters"
                    disabled={expandedOptions.length === 0}
                  />
                </StyledFloatingActions>
              </StyledFloatingContainer>
            </animated.div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
