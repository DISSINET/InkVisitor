import { autoUpdate, flip, FloatingPortal, offset, shift, useFloating } from "@floating-ui/react";
import { Button } from "components";
import React, { useEffect, useRef, useState } from "react";
import { MdClose } from "react-icons/md";
import { RiCloseFill } from "react-icons/ri";
import { animated, config, useSpring } from "react-spring";
import {
  StyledPillLabel,
  StyledUuidCount,
  StyledUuidList,
  StyledUuidListRow,
  StyledUuidListTitle,
  StyledUuidListValue,
  StyledUuidRemoveButton,
  StyledUuidsFloatingContainer,
  StyledUuidsHint,
  StyledUuidsPill,
  StyledUuidsRow,
} from "../EntitySearchBoxStyles";

const VIEWPORT_PADDING = 12;

interface EntitySearchUuids {
  entityIds: string[];
  labelIgnored: boolean;
  onRemove: (entityId: string) => void;
  onClearAll: () => void;
}
export const EntitySearchUuids: React.FC<EntitySearchUuids> = ({
  entityIds,
  labelIgnored,
  onRemove,
  onClearAll,
}) => {
  const [showList, setShowList] = useState(false);
  const [portalMounted, setPortalMounted] = useState(false);
  const hideTimeoutRef = useRef<number | null>(null);
  // read from the spring callback, which carries the state of the render that
  // started the animation and may run after a re-hover has interrupted it
  const showListRef = useRef(showList);
  showListRef.current = showList;

  const clearHideTimeout = () => {
    if (hideTimeoutRef.current !== null) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    clearHideTimeout();
    setPortalMounted(true);
    setShowList(true);
  };

  // the cursor has to cross a gap between the pill and the floating list, so
  // hiding is delayed long enough for it to land there
  const handleMouseLeave = () => {
    clearHideTimeout();
    hideTimeoutRef.current = window.setTimeout(() => {
      setShowList(false);
      hideTimeoutRef.current = null;
    }, 150);
  };

  useEffect(() => () => clearHideTimeout(), []);

  useEffect(() => {
    if (entityIds.length === 0) {
      setShowList(false);
      setPortalMounted(false);
    }
  }, [entityIds.length]);

  const animatedMount = useSpring({
    opacity: showList ? 1 : 0,
    config: config.stiff,
    // a faded-out list still occupies its box over the search results below, so
    // the portal is dropped once the fade finishes
    onRest: () => {
      if (!showListRef.current) {
        setPortalMounted(false);
      }
    },
  });

  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset({ mainAxis: 4 }),
      flip({ fallbackPlacements: ["top-start"] }),
      // the search box sits in the rightmost panel, so the list has to be pulled
      // back from the viewport edge it would otherwise touch
      shift({ padding: VIEWPORT_PADDING }),
    ],
  });

  if (entityIds.length === 0) {
    return null;
  }

  return (
    <>
      <StyledUuidsRow>
        <StyledUuidsPill
          ref={refs.setReference}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <StyledPillLabel>uuids</StyledPillLabel>
          <StyledUuidCount>{entityIds.length}</StyledUuidCount>
        </StyledUuidsPill>
        <Button
          tooltipLabel="Clear all uuids"
          icon={<RiCloseFill size={15} />}
          onClick={onClearAll}
          noBackground
          noBorder
          inverted
          color="danger"
        />
        {labelIgnored && <StyledUuidsHint>searching by uuid, label ignored</StyledUuidsHint>}
      </StyledUuidsRow>

      {portalMounted && (
        <FloatingPortal id="page-content">
          <div
            ref={refs.setFloating}
            style={{
              ...floatingStyles,
              zIndex: 1000,
              pointerEvents: showList ? "auto" : "none",
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <animated.div style={animatedMount}>
              <StyledUuidsFloatingContainer>
                <StyledUuidListTitle>{`${entityIds.length} uuid${
                  entityIds.length === 1 ? "" : "s"
                } searched`}</StyledUuidListTitle>
                <StyledUuidList>
                  {entityIds.map((entityId) => (
                    <StyledUuidListRow key={entityId}>
                      <StyledUuidListValue>{entityId}</StyledUuidListValue>
                      <StyledUuidRemoveButton
                        type="button"
                        aria-label={`Remove ${entityId}`}
                        onClick={() => onRemove(entityId)}
                      >
                        <MdClose size={13} />
                      </StyledUuidRemoveButton>
                    </StyledUuidListRow>
                  ))}
                </StyledUuidList>
              </StyledUuidsFloatingContainer>
            </animated.div>
          </div>
        </FloatingPortal>
      )}
    </>
  );
};
