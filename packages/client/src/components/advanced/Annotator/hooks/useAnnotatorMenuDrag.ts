import React, { useCallback, useRef, useState } from "react";

/** Minimum gap kept between a floating annotator panel and the edges of #page. */
export const ANNOTATOR_MENU_PAGE_PADDING = 4;

export interface AnnotatorMenuDrag {
  /** Spread onto the drag handle element. */
  dragHandleProps: {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
  /** Ref for the inner draggable layer (the element the transform sits on). */
  draggableRef: React.RefObject<HTMLDivElement | null>;
  dragOffset: { x: number; y: number };
  /** Puts the panel back at its Floating UI position (call on close). */
  resetDragOffset: () => void;
}

/**
 * Pointer dragging for a floating annotator panel. The offset is applied by the
 * caller as a translate() on an inner layer, never on the Floating UI root.
 * The panel is kept inside #page while dragging.
 */
export const useAnnotatorMenuDrag = (): AnnotatorMenuDrag => {
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const dragOffsetRef = useRef(dragOffset);
  dragOffsetRef.current = dragOffset;

  const dragSessionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    originX: number;
    originY: number;
  } | null>(null);

  const dragHandleRef = useRef<HTMLDivElement | null>(null);
  const dragWindowListenersRef = useRef<AbortController | null>(null);
  const draggableRef = useRef<HTMLDivElement | null>(null);

  const endDrag = useCallback((ev?: { pointerId: number }) => {
    const session = dragSessionRef.current;
    if (!session) return;
    if (ev !== undefined && ev.pointerId !== session.pointerId) return;

    dragWindowListenersRef.current?.abort();
    dragWindowListenersRef.current = null;

    const el = dragHandleRef.current;
    try {
      el?.releasePointerCapture(session.pointerId);
    } catch {
      /* capture already released */
    }
    dragHandleRef.current = null;
    dragSessionRef.current = null;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      dragWindowListenersRef.current?.abort();
      const ac = new AbortController();
      dragWindowListenersRef.current = ac;
      const signal = ac.signal;
      const pointerId = e.pointerId;

      dragHandleRef.current = e.currentTarget;
      e.currentTarget.setPointerCapture(pointerId);
      dragSessionRef.current = {
        pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        originX: dragOffsetRef.current.x,
        originY: dragOffsetRef.current.y,
      };

      const opts = { capture: true, signal } as const;
      const onWindowPointerEnd = (wev: PointerEvent) => {
        if (wev.pointerId !== pointerId) return;
        endDrag(wev);
      };
      window.addEventListener("pointerup", onWindowPointerEnd, opts);
      window.addEventListener("pointercancel", onWindowPointerEnd, opts);
      window.addEventListener("blur", () => endDrag(), opts);
      document.addEventListener(
        "visibilitychange",
        () => {
          if (document.visibilityState === "hidden") endDrag();
        },
        opts,
      );
    },
    [endDrag],
  );

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const session = dragSessionRef.current;
    if (!session || e.pointerId !== session.pointerId) return;
    e.preventDefault();
    const page = document.getElementById("page");
    const menuEl = draggableRef.current;
    let px = session.originX + (e.clientX - session.startClientX);
    let py = session.originY + (e.clientY - session.startClientY);

    if (page && menuEl) {
      const pr = page.getBoundingClientRect();
      const pad = ANNOTATOR_MENU_PAGE_PADDING;
      const mr = menuEl.getBoundingClientRect();
      const cur = dragOffsetRef.current;
      const innerLeft = (x: number) => mr.left + (x - cur.x);
      const innerTop = (y: number) => mr.top + (y - cur.y);
      for (let i = 0; i < 4; i++) {
        const l = innerLeft(px);
        const t = innerTop(py);
        const r = l + mr.width;
        const b = t + mr.height;
        if (l < pr.left + pad) px += pr.left + pad - l;
        if (t < pr.top + pad) py += pr.top + pad - t;
        if (r > pr.right - pad) px -= r - (pr.right - pad);
        if (b > pr.bottom - pad) py -= b - (pr.bottom - pad);
      }
    }

    setDragOffset({ x: px, y: py });
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      endDrag(e.nativeEvent);
    },
    [endDrag],
  );

  const resetDragOffset = useCallback(() => {
    setDragOffset({ x: 0, y: 0 });
  }, []);

  return {
    dragHandleProps: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    draggableRef,
    dragOffset,
    resetDragOffset,
  };
};
