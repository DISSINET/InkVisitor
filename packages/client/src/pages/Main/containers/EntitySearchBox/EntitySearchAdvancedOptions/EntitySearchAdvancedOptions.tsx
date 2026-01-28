import {
  autoUpdate,
  FloatingPortal,
  offset,
  useFloating,
} from "@floating-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { CgOptions } from "react-icons/cg";
import { animated, config, useSpring } from "react-spring";
import {
  StyledAdvancedOptions,
  StyledAdvancedOptionsSign,
  StyledBubblesContainer,
  StyledBubble,
  StyledBubbleLabel,
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
}
export const EntitySearchAdvancedOptions: React.FC<
  EntitySearchAdvancedOptions
> = ({ expandedOptions, setExpandedOptions }) => {
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
              <StyledBubblesContainer>
                {advancedOptions.map((option) => {
                  const isSelected = expandedOptions.includes(option);
                  return (
                    <StyledBubble
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
                      <StyledBubbleLabel>{option}</StyledBubbleLabel>
                    </StyledBubble>
                  );
                })}
              </StyledBubblesContainer>
            </animated.div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
