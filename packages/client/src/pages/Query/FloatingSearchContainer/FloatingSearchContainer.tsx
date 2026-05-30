import { FloatingPortal } from "@floating-ui/react";
import { Button } from "components";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { GrClose } from "react-icons/gr";
import { floorNumberToOneDecimal } from "utils/utils";
import { ExploreAction } from "../Explorer/state";
import { Explore } from "@inkvisitor/shared/types/query";
import { FloatingSearchForm } from "./FloatingSearchForm";
import {
  FLOATING_SEARCH_COLLAPSED_SIZE,
  FLOATING_SEARCH_EXPANDED_WIDTH,
  FLOATING_SEARCH_PAGE_PADDING,
  StyledCloseButtonWrap,
  StyledCollapsedButton,
  StyledDragHandle,
  StyledExpandedContent,
  StyledExpandedHeader,
  StyledExpandedPanel,
  StyledFloatingRoot,
} from "./FloatingSearchContainerStyles";

const EXPANDED_POSITION_STORAGE_KEY = "queryFloatingSearchExpandedPositionV2";

interface StoredPosition {
  xPercent: number;
  yPercent: number;
  isCustom: boolean;
}

interface ViewportPosition {
  x: number;
  y: number;
}

interface FloatingSearchContainerProps {
  /** Width of the right-side panel to keep the container out of (detail panel). */
  rightInset?: number;
  filters: Explore.IExploreColumnFilter[];
  exploreDispatch: React.Dispatch<ExploreAction>;
}

const getPageContentRect = (): DOMRect => {
  const page = document.getElementById("page-content");
  if (page) {
    return page.getBoundingClientRect();
  }
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
};

const loadStoredExpandedPosition = (): StoredPosition | null => {
  const raw = localStorage.getItem(EXPANDED_POSITION_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StoredPosition;
    if (
      typeof parsed.xPercent === "number" &&
      typeof parsed.yPercent === "number" &&
      parsed.isCustom === true
    ) {
      return parsed;
    }
  } catch {
    /* ignore invalid storage */
  }
  return null;
};

const saveStoredExpandedPosition = (position: StoredPosition) => {
  localStorage.setItem(EXPANDED_POSITION_STORAGE_KEY, JSON.stringify(position));
};

const clampPosition = (
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
  rightInset: number,
  pageRect = getPageContentRect(),
): ViewportPosition => {
  const availableWidth = pageRect.width - rightInset;
  const minX = pageRect.left + FLOATING_SEARCH_PAGE_PADDING;
  const maxX = pageRect.left + availableWidth - panelWidth - FLOATING_SEARCH_PAGE_PADDING;
  const minY = pageRect.top + FLOATING_SEARCH_PAGE_PADDING;
  const maxY = pageRect.top + pageRect.height - panelHeight - FLOATING_SEARCH_PAGE_PADDING;

  return {
    x: Math.min(Math.max(minX, x), Math.max(minX, maxX)),
    y: Math.min(Math.max(minY, y), Math.max(minY, maxY)),
  };
};

const getDefaultPosition = (
  panelWidth: number,
  panelHeight: number,
  rightInset: number,
  pageRect = getPageContentRect(),
): ViewportPosition => {
  const availableWidth = pageRect.width - rightInset;
  return clampPosition(
    pageRect.left + availableWidth - panelWidth - FLOATING_SEARCH_PAGE_PADDING,
    pageRect.top + FLOATING_SEARCH_PAGE_PADDING,
    panelWidth,
    panelHeight,
    rightInset,
    pageRect,
  );
};

const positionFromStorage = (
  stored: StoredPosition,
  panelWidth: number,
  panelHeight: number,
  rightInset: number,
  pageRect = getPageContentRect(),
): ViewportPosition => {
  const availableWidth = pageRect.width - rightInset;
  const x = pageRect.left + stored.xPercent * (availableWidth / 100);
  const y = pageRect.top + stored.yPercent * (pageRect.height / 100);
  return clampPosition(x, y, panelWidth, panelHeight, rightInset, pageRect);
};

const positionToStorage = (
  x: number,
  y: number,
  rightInset: number,
  pageRect = getPageContentRect(),
): StoredPosition => {
  const availableWidth = pageRect.width - rightInset;
  const relativeX = x - pageRect.left;
  const relativeY = y - pageRect.top;
  return {
    xPercent: floorNumberToOneDecimal(relativeX / (availableWidth / 100)),
    yPercent: floorNumberToOneDecimal(relativeY / (pageRect.height / 100)),
    isCustom: true,
  };
};

export const FloatingSearchContainer: React.FC<FloatingSearchContainerProps> = ({
  rightInset = 0,
  filters,
  exploreDispatch,
}) => {
  const rightInsetRef = useRef(rightInset);
  rightInsetRef.current = rightInset;

  const hasCustomExpandedPositionRef = useRef(loadStoredExpandedPosition() !== null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [collapsedPosition, setCollapsedPosition] = useState<ViewportPosition>({ x: 0, y: 0 });
  const [expandedPosition, setExpandedPosition] = useState<ViewportPosition>({ x: 0, y: 0 });

  const expandedPositionRef = useRef(expandedPosition);
  expandedPositionRef.current = expandedPosition;

  const isExpandedRef = useRef(isExpanded);
  isExpandedRef.current = isExpanded;

  const dragSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    panelHeight: number;
  } | null>(null);

  const dragWindowListenersRef = useRef<AbortController | null>(null);
  const expandedPanelRef = useRef<HTMLDivElement>(null);

  const getExpandedPanelHeight = useCallback(() => {
    return expandedPanelRef.current?.getBoundingClientRect().height ?? 120;
  }, []);

  const syncCollapsedPosition = useCallback(() => {
    setCollapsedPosition(
      getDefaultPosition(
        FLOATING_SEARCH_COLLAPSED_SIZE,
        FLOATING_SEARCH_COLLAPSED_SIZE,
        rightInsetRef.current,
      ),
    );
  }, []);

  const syncExpandedPosition = useCallback(
    (useCustom: boolean) => {
      const pageRect = getPageContentRect();
      const height = getExpandedPanelHeight();

      if (useCustom) {
        const stored = loadStoredExpandedPosition();
        if (stored) {
          setExpandedPosition(
            positionFromStorage(
              stored,
              FLOATING_SEARCH_EXPANDED_WIDTH,
              height,
              rightInsetRef.current,
              pageRect,
            ),
          );
          return;
        }
      }

      setExpandedPosition(
        getDefaultPosition(FLOATING_SEARCH_EXPANDED_WIDTH, height, rightInsetRef.current, pageRect),
      );
    },
    [getExpandedPanelHeight],
  );

  const syncLayoutPositions = useCallback(() => {
    syncCollapsedPosition();
    if (isExpandedRef.current) {
      syncExpandedPosition(hasCustomExpandedPositionRef.current);
    }
  }, [syncCollapsedPosition, syncExpandedPosition]);

  useLayoutEffect(() => {
    syncCollapsedPosition();
  }, [syncCollapsedPosition, rightInset]);

  useLayoutEffect(() => {
    if (isExpanded) {
      syncExpandedPosition(hasCustomExpandedPositionRef.current);
    }
  }, [isExpanded, syncExpandedPosition, rightInset]);

  const persistExpandedPosition = useCallback((x: number, y: number) => {
    saveStoredExpandedPosition(positionToStorage(x, y, rightInsetRef.current));
  }, []);

  const applyExpandedPosition = useCallback(
    (x: number, y: number, height: number, persist = false) => {
      const clamped = clampPosition(
        x,
        y,
        FLOATING_SEARCH_EXPANDED_WIDTH,
        height,
        rightInsetRef.current,
      );
      setExpandedPosition(clamped);
      if (persist) {
        hasCustomExpandedPositionRef.current = true;
        persistExpandedPosition(clamped.x, clamped.y);
      }
      return clamped;
    },
    [persistExpandedPosition],
  );

  useEffect(() => {
    const handleResize = () => {
      syncLayoutPositions();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [syncLayoutPositions]);

  const endDrag = useCallback((ev?: { pointerId: number }) => {
    const session = dragSessionRef.current;
    if (!session) {
      return;
    }
    if (ev !== undefined && ev.pointerId !== session.pointerId) {
      return;
    }

    dragWindowListenersRef.current?.abort();
    dragWindowListenersRef.current = null;
    dragSessionRef.current = null;
  }, []);

  const handleDragPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      dragWindowListenersRef.current?.abort();
      const ac = new AbortController();
      dragWindowListenersRef.current = ac;
      const signal = ac.signal;
      const pointerId = e.pointerId;
      const panelHeight = getExpandedPanelHeight();

      dragSessionRef.current = {
        pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originX: expandedPositionRef.current.x,
        originY: expandedPositionRef.current.y,
        panelHeight,
      };

      e.currentTarget.setPointerCapture(pointerId);

      const onWindowPointerMove = (wev: PointerEvent) => {
        const session = dragSessionRef.current;
        if (!session || wev.pointerId !== session.pointerId) {
          return;
        }
        const nextX = session.originX + (wev.clientX - session.startClientX);
        const nextY = session.originY + (wev.clientY - session.startClientY);
        applyExpandedPosition(nextX, nextY, session.panelHeight);
      };

      const onWindowPointerEnd = (wev: PointerEvent) => {
        if (wev.pointerId !== pointerId) {
          return;
        }
        const session = dragSessionRef.current;
        if (session) {
          const nextX = session.originX + (wev.clientX - session.startClientX);
          const nextY = session.originY + (wev.clientY - session.startClientY);
          applyExpandedPosition(nextX, nextY, session.panelHeight, true);
        }
        endDrag(wev);
      };

      const opts = { capture: true, signal } as const;
      window.addEventListener("pointermove", onWindowPointerMove, opts);
      window.addEventListener("pointerup", onWindowPointerEnd, opts);
      window.addEventListener("pointercancel", onWindowPointerEnd, opts);
      window.addEventListener("blur", () => endDrag(), opts);
    },
    [applyExpandedPosition, endDrag, getExpandedPanelHeight],
  );

  const handleExpand = () => {
    syncExpandedPosition(hasCustomExpandedPositionRef.current);
    setIsExpanded(true);
  };

  useEffect(() => {
    return () => {
      dragWindowListenersRef.current?.abort();
    };
  }, []);

  const displayPosition = isExpanded ? expandedPosition : collapsedPosition;

  return (
    <FloatingPortal id="page-content">
      <StyledFloatingRoot $left={displayPosition.x} $top={displayPosition.y}>
        {isExpanded ? (
          <StyledExpandedPanel ref={expandedPanelRef}>
            <StyledExpandedHeader>
              <StyledDragHandle
                onPointerDown={handleDragPointerDown}
                aria-label="Drag search panel"
              >
                <span>Search</span>
              </StyledDragHandle>
              <StyledCloseButtonWrap>
                <Button
                  icon={<GrClose size={14} />}
                  onClick={() => setIsExpanded(false)}
                  noBorder
                  color="black"
                  noBackground
                  inverted
                  tooltipLabel="close search panel"
                />
              </StyledCloseButtonWrap>
            </StyledExpandedHeader>
            <StyledExpandedContent>
              <FloatingSearchForm dispatch={exploreDispatch} />
            </StyledExpandedContent>
          </StyledExpandedPanel>
        ) : (
          <StyledCollapsedButton
            type="button"
            onClick={handleExpand}
            aria-label="Open search panel"
            aria-expanded={false}
          >
            <BiSearch size={22} />
          </StyledCollapsedButton>
        )}
      </StyledFloatingRoot>
    </FloatingPortal>
  );
};
