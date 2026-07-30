import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  UseDocumentPresence,
  useDocumentPresence,
} from "./useDocumentPresence";

const DOC = "doc-1";
const OTHER_DOC = "doc-2";

/**
 * Fake socket surface. Records what the hook emits and lets a test push server
 * events into the handlers the hook registered.
 */
const ws = vi.hoisted(() => {
  const handlers = new Map<string, Set<(payload: any) => void>>();
  const connectHandlers = new Set<() => void>();
  const emitted: { event: string; payload: any }[] = [];
  let ackGranted = true;

  return {
    handlers,
    connectHandlers,
    emitted,
    get ackGranted() {
      return ackGranted;
    },
    setAckGranted(value: boolean) {
      ackGranted = value;
    },
    reset() {
      handlers.clear();
      connectHandlers.clear();
      emitted.length = 0;
      ackGranted = true;
    },
    /** Delivers a server→client event to every registered handler. */
    server(event: string, payload: any) {
      handlers.get(event)?.forEach((handler) => handler(payload));
    },
    /** Fires the socket "connect" event, as a reconnect does. */
    reconnect() {
      connectHandlers.forEach((handler) => handler());
    },
    names() {
      return emitted.map((entry) => entry.event);
    },
    count(event: string) {
      return emitted.filter((entry) => entry.event === event).length;
    },
    payloads(event: string) {
      return emitted
        .filter((entry) => entry.event === event)
        .map((entry) => entry.payload);
    },
  };
});

vi.mock("api", () => ({
  default: {
    wsOn: (event: string, handler: (payload: any) => void) => {
      const set = ws.handlers.get(event) ?? new Set();
      set.add(handler);
      ws.handlers.set(event, set);
      return () => {
        ws.handlers.get(event)?.delete(handler);
      };
    },
    wsEmit: (
      event: string,
      payload: unknown,
      ack?: (result: { granted: boolean }) => void
    ) => {
      ws.emitted.push({ event, payload });
      ack?.({ granted: ws.ackGranted });
    },
    wsId: () => "socket-1",
    wsOnConnect: (handler: () => void) => {
      ws.connectHandlers.add(handler);
      return () => {
        ws.connectHandlers.delete(handler);
      };
    },
  },
}));

let queryClient: QueryClient;
let invalidateSpy: ReturnType<typeof vi.spyOn>;

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const setup = (props: Partial<UseDocumentPresence> = {}) =>
  renderHook((p: UseDocumentPresence) => useDocumentPresence(p), {
    initialProps: {
      documentId: DOC,
      isChangeMade: false,
      localTextContent: "text",
      canEditDocument: true,
      ...props,
    } as UseDocumentPresence,
    wrapper,
  });

const invalidatedKeys = () =>
  invalidateSpy.mock.calls.map((call: any[]) =>
    JSON.stringify(call[0]?.queryKey)
  );

beforeEach(() => {
  vi.useFakeTimers();
  ws.reset();
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
});

describe("useDocumentPresence", () => {
  it("watches the document on mount and unwatches on unmount", () => {
    const { unmount } = setup();

    expect(ws.payloads("document:watch")).toEqual([{ documentId: DOC }]);
    expect(ws.names()).not.toContain("document:unwatch");

    act(() => unmount());

    expect(ws.payloads("document:unwatch")).toEqual([{ documentId: DOC }]);
  });

  it("reports a lock held by another user", () => {
    const { result } = setup();

    expect(result.current.lockedByOther).toBe(false);

    act(() => {
      ws.server("document:lock", {
        documentId: DOC,
        lock: { userId: "u2", userName: "Other User" },
      });
    });

    expect(result.current.lockedByOther).toBe(true);
    expect(result.current.lockHolderName).toBe("Other User");

    act(() => {
      ws.server("document:lock", { documentId: DOC, lock: null });
    });

    expect(result.current.lockedByOther).toBe(false);
    expect(result.current.lockHolderName).toBe(null);
  });

  it("ignores a lock announcement for another document", () => {
    const { result } = setup();

    act(() => {
      ws.server("document:lock", {
        documentId: OTHER_DOC,
        lock: { userId: "u2", userName: "Other User" },
      });
    });

    expect(result.current.lockedByOther).toBe(false);
    expect(result.current.lockHolderName).toBe(null);
  });

  it("claims the lock on the first change and releases it when clean again", () => {
    const { rerender } = setup();

    expect(ws.count("document:edit:start")).toBe(0);

    act(() => {
      rerender({
        documentId: DOC,
        isChangeMade: true,
        localTextContent: "text!",
        canEditDocument: true,
      });
    });

    expect(ws.payloads("document:edit:start")).toEqual([{ documentId: DOC }]);
    expect(ws.count("document:edit:end")).toBe(0);

    act(() => {
      rerender({
        documentId: DOC,
        isChangeMade: false,
        localTextContent: "text!",
        canEditDocument: true,
      });
    });

    expect(ws.payloads("document:edit:end")).toEqual([{ documentId: DOC }]);
    expect(ws.count("document:edit:start")).toBe(1);
  });

  it("stays locked by the other user when the claim is refused", () => {
    const { result, rerender } = setup();

    act(() => {
      ws.server("document:lock", {
        documentId: DOC,
        lock: { userId: "u2", userName: "Other User" },
      });
    });

    ws.setAckGranted(false);

    act(() => {
      rerender({
        documentId: DOC,
        isChangeMade: true,
        localTextContent: "text!",
        canEditDocument: true,
      });
    });

    expect(ws.count("document:edit:start")).toBe(1);
    expect(result.current.lockedByOther).toBe(true);
    expect(result.current.lockHolderName).toBe("Other User");
  });

  it("never claims the lock without edit permission", () => {
    setup({ canEditDocument: false, isChangeMade: true });

    expect(ws.names()).toContain("document:watch");
    expect(ws.count("document:edit:start")).toBe(0);
  });

  it("invalidates queries on a remote change while clean", () => {
    const { result } = setup();

    act(() => {
      ws.server("document:changed", {
        documentId: DOC,
        userId: "u2",
        userName: "Other User",
        eventType: "documentUpdate",
      });
    });

    expect(invalidatedKeys()).toEqual([
      JSON.stringify(["document", DOC]),
      JSON.stringify(["anchorEntities"]),
      JSON.stringify(["tree"]),
    ]);
    expect(result.current.remoteChange).toBe(null);
  });

  it("keeps local edits and reports a remote change while dirty", () => {
    const { result } = setup({ isChangeMade: true });

    act(() => {
      ws.server("document:changed", {
        documentId: DOC,
        userId: "u2",
        userName: "Other User",
        eventType: "documentUpdate",
      });
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(result.current.remoteChange).toEqual({ userName: "Other User" });

    act(() => result.current.dismissRemoteChange());

    expect(result.current.remoteChange).toBe(null);
  });

  it("rewatches and reclaims after a reconnect while dirty", () => {
    setup({ isChangeMade: true });

    expect(ws.count("document:watch")).toBe(1);
    expect(ws.count("document:edit:start")).toBe(1);

    act(() => ws.reconnect());

    expect(ws.count("document:watch")).toBe(2);
    expect(ws.count("document:edit:start")).toBe(2);
  });

  it("heartbeats while holding the lock", () => {
    setup({ isChangeMade: true });

    expect(ws.count("document:edit:heartbeat")).toBe(0);

    act(() => vi.advanceTimersByTime(20_000));
    expect(ws.count("document:edit:heartbeat")).toBe(1);

    act(() => vi.advanceTimersByTime(20_000));
    expect(ws.count("document:edit:heartbeat")).toBe(2);
  });

  it("opens the idle prompt after a minute without typing", () => {
    const { result } = setup({ isChangeMade: true });

    act(() => vi.advanceTimersByTime(59_000));
    expect(result.current.idlePromptOpen).toBe(false);

    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.idlePromptOpen).toBe(true);
  });

  it("keeps the lock while the idle prompt waits, however long it is ignored", () => {
    const { result } = setup({ isChangeMade: true });

    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.idlePromptOpen).toBe(true);

    // Unanswered for another five minutes: the text is still unsaved, so handing
    // the document to somebody else would strand it.
    act(() => vi.advanceTimersByTime(300_000));

    expect(ws.count("document:edit:end")).toBe(0);
    expect(result.current.idlePromptOpen).toBe(true);
    expect(result.current.lockedByOther).toBe(false);
  });

  it("keeps heartbeating while the idle prompt waits, so the server TTL cannot expire the lock", () => {
    setup({ isChangeMade: true });

    act(() => vi.advanceTimersByTime(60_000));
    const beforeWait = ws.count("document:edit:heartbeat");

    act(() => vi.advanceTimersByTime(60_000));

    expect(ws.count("document:edit:heartbeat")).toBeGreaterThan(beforeWait);
  });

  it("releases the lock once the edits are resolved", () => {
    const { rerender } = setup({ isChangeMade: true });

    act(() => vi.advanceTimersByTime(60_000));
    expect(ws.count("document:edit:end")).toBe(0);

    // Save and Discard both land here: they clear the local edits.
    act(() => {
      rerender({
        documentId: DOC,
        isChangeMade: false,
        localTextContent: "text",
        canEditDocument: true,
      });
    });

    expect(ws.payloads("document:edit:end")).toEqual([{ documentId: DOC }]);
  });

  it("restarts the idle countdown on typing", () => {
    const { result, rerender } = setup({ isChangeMade: true });

    act(() => vi.advanceTimersByTime(50_000));

    act(() => {
      rerender({
        documentId: DOC,
        isChangeMade: true,
        localTextContent: "text typed",
        canEditDocument: true,
      });
    });

    act(() => vi.advanceTimersByTime(50_000));
    expect(result.current.idlePromptOpen).toBe(false);

    act(() => vi.advanceTimersByTime(10_000));
    expect(result.current.idlePromptOpen).toBe(true);

    act(() => result.current.continueEditing());
    expect(result.current.idlePromptOpen).toBe(false);

    act(() => vi.advanceTimersByTime(59_000));
    expect(result.current.idlePromptOpen).toBe(false);
  });

  it("resets presence state when the document changes", () => {
    const { result, rerender } = setup();

    act(() => {
      ws.server("document:lock", {
        documentId: DOC,
        lock: { userId: "u2", userName: "Other User" },
      });
    });
    expect(result.current.lockedByOther).toBe(true);

    act(() => {
      rerender({
        documentId: OTHER_DOC,
        isChangeMade: false,
        localTextContent: "text",
        canEditDocument: true,
      });
    });

    expect(result.current.lockedByOther).toBe(false);
    expect(result.current.lockHolderName).toBe(null);
    expect(ws.payloads("document:unwatch")).toEqual([{ documentId: DOC }]);
    expect(ws.payloads("document:watch")).toEqual([
      { documentId: DOC },
      { documentId: OTHER_DOC },
    ]);
  });

  it("reloads the document on demand after a remote change", () => {
    const { result } = setup({ isChangeMade: true });

    act(() => {
      ws.server("document:changed", {
        documentId: DOC,
        userId: "u2",
        userName: "Other User",
        eventType: "documentUpdate",
      });
    });

    act(() => result.current.reloadRemote());

    expect(invalidatedKeys()).toEqual([
      JSON.stringify(["document", DOC]),
      JSON.stringify(["anchorEntities"]),
      JSON.stringify(["tree"]),
    ]);
    expect(result.current.remoteChange).toBe(null);
  });
});
