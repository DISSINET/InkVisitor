import { FloatingPortal } from "@floating-ui/react";
import { Button } from "components";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { BiSearch } from "react-icons/bi";
import { FiMove } from "react-icons/fi";
import { GrClose } from "react-icons/gr";
import { floorNumberToOneDecimal } from "utils/utils";
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

const POSITION_STORAGE_KEY = "queryFloatingSearchPositionV2";

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
  children?: React.ReactNode;
  /** Width of the right-side panel to keep the container out of (detail panel). */
  rightInset?: number;
}

const getPageContentRect = (): DOMRect => {
  const page = document.getElementById("page-content");
  if (page) {
    return page.getBoundingClientRect();
  }
  return new DOMRect(0, 0, window.innerWidth, window.innerHeight);
};

const loadStoredPosition = (): StoredPosition | null => {
  const raw = localStorage.getItem(POSITION_STORAGE_KEY);
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

const saveStoredPosition = (position: StoredPosition) => {
  localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(position));
};

const clampPosition = (
  x: number,
  y: number,
  panelWidth: number,
  panelHeight: number,
  rightInset: number,
  pageRect = getPageContentRect()
): ViewportPosition => {
  const availableWidth = pageRect.width - rightInset;
  const minX = pageRect.left + FLOATING_SEARCH_PAGE_PADDING;
  const maxX = pageRect.left + availableWidth - panelWidth - FLOATING_SEARCH_PAGE_PADDING;
  const minY = pageRect.top + FLOATING_SEARCH_PAGE_PADDING;
  const maxY =
    pageRect.top + pageRect.height - panelHeight - FLOATING_SEARCH_PAGE_PADDING;

  return {
    x: Math.min(Math.max(minX, x), Math.max(minX, maxX)),
    y: Math.min(Math.max(minY, y), Math.max(minY, maxY)),
  };
};

const getDefaultPosition = (
  panelWidth: number,
  panelHeight: number,
  rightInset: number,
  pageRect = getPageContentRect()
): ViewportPosition => {
  const availableWidth = pageRect.width - rightInset;
  return clampPosition(
    pageRect.left + availableWidth - panelWidth - FLOATING_SEARCH_PAGE_PADDING,
    pageRect.top + FLOATING_SEARCH_PAGE_PADDING,
    panelWidth,
    panelHeight,
    rightInset,
    pageRect
  );
};

const positionFromStorage = (
  stored: StoredPosition,
  panelWidth: number,
  panelHeight: number,
  rightInset: number,
  pageRect = getPageContentRect()
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
  pageRect = getPageContentRect()
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
  children,
  rightInset = 0,
}) => {
  const rightInsetRef = useRef(rightInset);
  rightInsetRef.current = rightInset;

  const hasCustomPositionRef = useRef(loadStoredPosition() !== null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [position, setPosition] = useState<ViewportPosition>({ x: 0, y: 0 });

  const positionRef = useRef(position);
  positionRef.current = position;

  const dragSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
    panelWidth: number;
    panelHeight: number;
  } | null>(null);

  const dragWindowListenersRef = useRef<AbortController | null>(null);

  const panelWidth = isExpanded
    ? FLOATING_SEARCH_EXPANDED_WIDTH
    : FLOATING_SEARCH_COLLAPSED_SIZE;
  const panelHeightRef = useRef(FLOATING_SEARCH_COLLAPSED_SIZE);
  const rootRef = useRef<HTMLDivElement>(null);

  const getPanelHeight = useCallback(() => {
    return (
      rootRef.current?.getBoundingClientRect().height ??
      (isExpanded ? 120 : FLOATING_SEARCH_COLLAPSED_SIZE)
    );
  }, [isExpanded]);

  const syncPosition = useCallback(
    (useCustom: boolean) => {
      const pageRect = getPageContentRect();
      const height = getPanelHeight();
      panelHeightRef.current = height;

      if (useCustom) {
        const stored = loadStoredPosition();
        if (stored) {
          setPosition(
            positionFromStorage(stored, panelWidth, height, rightInsetRef.current, pageRect)
          );
          return;
        }
      }

      setPosition(
        getDefaultPosition(panelWidth, height, rightInsetRef.current, pageRect)
      );
    },
    [getPanelHeight, panelWidth]
  );

  useLayoutEffect(() => {
    syncPosition(hasCustomPositionRef.current);
  }, [syncPosition, rightInset]);

  useLayoutEffect(() => {
    panelHeightRef.current = getPanelHeight();
    syncPosition(hasCustomPositionRef.current);
  }, [isExpanded, panelWidth, getPanelHeight, syncPosition]);

  const persistPosition = useCallback((x: number, y: number) => {
    saveStoredPosition(positionToStorage(x, y, rightInsetRef.current));
  }, []);

  const applyPosition = useCallback(
    (x: number, y: number, width: number, height: number, persist = false) => {
      const clamped = clampPosition(x, y, width, height, rightInsetRef.current);
      setPosition(clamped);
      if (persist) {
        hasCustomPositionRef.current = true;
        persistPosition(clamped.x, clamped.y);
      }
      return clamped;
    },
    [persistPosition]
  );

  useEffect(() => {
    const handleResize = () => {
      syncPosition(hasCustomPositionRef.current);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [syncPosition]);

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
      const panelHeight = getPanelHeight();

      dragSessionRef.current = {
        pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originX: positionRef.current.x,
        originY: positionRef.current.y,
        panelWidth,
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
        applyPosition(nextX, nextY, session.panelWidth, session.panelHeight);
      };

      const onWindowPointerEnd = (wev: PointerEvent) => {
        if (wev.pointerId !== pointerId) {
          return;
        }
        const session = dragSessionRef.current;
        if (session) {
          const nextX = session.originX + (wev.clientX - session.startClientX);
          const nextY = session.originY + (wev.clientY - session.startClientY);
          applyPosition(nextX, nextY, session.panelWidth, session.panelHeight, true);
        }
        endDrag(wev);
      };

      const opts = { capture: true, signal } as const;
      window.addEventListener("pointermove", onWindowPointerMove, opts);
      window.addEventListener("pointerup", onWindowPointerEnd, opts);
      window.addEventListener("pointercancel", onWindowPointerEnd, opts);
      window.addEventListener("blur", () => endDrag(), opts);
    },
    [applyPosition, endDrag, getPanelHeight, panelWidth]
  );

  useEffect(() => {
    return () => {
      dragWindowListenersRef.current?.abort();
    };
  }, []);

  return (
    <FloatingPortal id="page-content">
      <StyledFloatingRoot ref={rootRef} $left={position.x} $top={position.y}>
        {isExpanded ? (
          <StyledExpandedPanel>
            <StyledExpandedHeader>
              <StyledDragHandle
                onPointerDown={handleDragPointerDown}
                aria-label="Drag search panel"
              >
                <FiMove size={14} />
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
            <StyledExpandedContent>{children}</StyledExpandedContent>
          </StyledExpandedPanel>
        ) : (
          <StyledCollapsedButton
            type="button"
            onClick={() => setIsExpanded(true)}
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
