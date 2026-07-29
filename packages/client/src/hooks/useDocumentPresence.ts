import { useQueryClient } from "@tanstack/react-query";
import api from "api";
import { useCallback, useEffect, useRef, useState } from "react";

/** Kept well under the server's 60s lock TTL. */
const HEARTBEAT_INTERVAL_MS = 20_000;
/** Silence after which the holder is asked whether it is still editing. */
const IDLE_PROMPT_MS = 60_000;
/** Grace period after the prompt before the lock is handed back. */
const IDLE_RELEASE_MS = 60_000;

interface DocumentLock {
  userId: string;
  userName: string;
}

export interface UseDocumentPresence {
  documentId: string | undefined;
  isChangeMade: boolean;
  /** Changes on every keystroke; its changing is what resets the idle timer. */
  localTextContent: string;
  canEditDocument: boolean;
}

export interface DocumentPresence {
  lockedByOther: boolean;
  lockHolderName: string | null;
  remoteChange: { userName: string } | null;
  reloadRemote: () => void;
  dismissRemoteChange: () => void;
  idlePromptOpen: boolean;
  continueEditing: () => void;
  lockAutoReleased: boolean;
}

/**
 * Client half of the document presence protocol: room membership, the edit
 * lock, and receipts for writes made by other users.
 *
 * Lock ownership is whatever the server said in the `document:edit:start` ack,
 * never a local guess - a client that dirties its text while someone else holds
 * the lock is refused, and only the ack reveals that.
 */
export function useDocumentPresence({
  documentId,
  isChangeMade,
  localTextContent,
  canEditDocument,
}: UseDocumentPresence): DocumentPresence {
  const queryClient = useQueryClient();

  const [lock, setLock] = useState<DocumentLock | null>(null);
  const [lockGranted, setLockGranted] = useState(false);
  const [remoteChange, setRemoteChange] = useState<{ userName: string } | null>(
    null
  );
  const [idlePromptOpen, setIdlePromptOpen] = useState(false);
  const [lockAutoReleased, setLockAutoReleased] = useState(false);
  /** Bumped by continueEditing to restart the idle countdown. */
  const [idleResetToken, setIdleResetToken] = useState(0);

  // Read inside socket handlers and timers, which must survive a keystroke
  // without being torn down and rebuilt.
  const isChangeMadeRef = useRef(isChangeMade);
  const canEditDocumentRef = useRef(canEditDocument);
  isChangeMadeRef.current = isChangeMade;
  canEditDocumentRef.current = canEditDocument;

  const invalidateDocument = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["document", documentId] });
    queryClient.invalidateQueries({ queryKey: ["anchorEntities"] });
    queryClient.invalidateQueries({ queryKey: ["tree"] });
  }, [queryClient, documentId]);

  const claimLock = useCallback(() => {
    if (!documentId) {
      return;
    }
    api.wsEmit(
      "document:edit:start",
      { documentId },
      (result: { granted?: boolean } | undefined) => {
        setLockGranted(result?.granted === true);
      }
    );
  }, [documentId]);

  // Room membership. The cleanup also wipes presence state, so a switch to
  // another document never shows the previous document's lock or receipt.
  useEffect(() => {
    if (!documentId) {
      return;
    }
    api.wsEmit("document:watch", { documentId });
    return () => {
      api.wsEmit("document:unwatch", { documentId });
      setLock(null);
      setLockGranted(false);
      setRemoteChange(null);
      setIdlePromptOpen(false);
      setLockAutoReleased(false);
    };
  }, [documentId]);

  // A reconnect arrives with a new socket id, no room membership, and the lock
  // already released by the server's disconnect handling.
  useEffect(() => {
    if (!documentId) {
      return;
    }
    return api.wsOnConnect(() => {
      api.wsEmit("document:watch", { documentId });
      setLockGranted(false);
      if (isChangeMadeRef.current && canEditDocumentRef.current) {
        claimLock();
      }
    });
  }, [documentId, claimLock]);

  useEffect(() => {
    if (!documentId) {
      return;
    }
    const unsubscribeLock = api.wsOn(
      "document:lock",
      (payload: { documentId: string; lock: DocumentLock | null }) => {
        if (payload.documentId !== documentId) {
          return;
        }
        setLock(payload.lock ?? null);
        if (!payload.lock) {
          setLockGranted(false);
        }
      }
    );

    const unsubscribeChanged = api.wsOn(
      "document:changed",
      (payload: { documentId: string; userName: string }) => {
        if (payload.documentId !== documentId) {
          return;
        }
        // Refetching over unsaved local text would throw the user's typing
        // away; the receipt lets the UI offer the choice.
        if (isChangeMadeRef.current) {
          setRemoteChange({ userName: payload.userName });
        } else {
          invalidateDocument();
        }
      }
    );

    return () => {
      unsubscribeLock();
      unsubscribeChanged();
    };
  }, [documentId, invalidateDocument]);

  // Claims while dirty, releases on the way back to clean and on unmount.
  useEffect(() => {
    if (!documentId || !canEditDocument || !isChangeMade) {
      return;
    }
    claimLock();
    return () => {
      api.wsEmit("document:edit:end", { documentId });
      setLockGranted(false);
      setIdlePromptOpen(false);
      setLockAutoReleased(false);
    };
  }, [documentId, canEditDocument, isChangeMade, claimLock]);

  useEffect(() => {
    if (!documentId || !lockGranted || lockAutoReleased) {
      return;
    }
    const interval = setInterval(() => {
      api.wsEmit("document:edit:heartbeat", { documentId });
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [documentId, lockGranted, lockAutoReleased]);

  // localTextContent is a dependency because a keystroke is what restarts the
  // countdown. The release timer is started from inside the prompt timer so
  // that opening the prompt does not itself restart anything.
  useEffect(() => {
    if (!documentId || !lockGranted || lockAutoReleased) {
      return;
    }
    let releaseTimer: ReturnType<typeof setTimeout> | undefined;
    const promptTimer = setTimeout(() => {
      setIdlePromptOpen(true);
      releaseTimer = setTimeout(() => {
        api.wsEmit("document:edit:end", { documentId });
        setIdlePromptOpen(false);
        setLockGranted(false);
        setLockAutoReleased(true);
      }, IDLE_RELEASE_MS);
    }, IDLE_PROMPT_MS);

    return () => {
      clearTimeout(promptTimer);
      if (releaseTimer) {
        clearTimeout(releaseTimer);
      }
    };
  }, [documentId, lockGranted, lockAutoReleased, localTextContent, idleResetToken]);

  const continueEditing = useCallback(() => {
    setIdlePromptOpen(false);
    setIdleResetToken((token) => token + 1);
  }, []);

  const dismissRemoteChange = useCallback(() => {
    setRemoteChange(null);
  }, []);

  const reloadRemote = useCallback(() => {
    invalidateDocument();
    setRemoteChange(null);
  }, [invalidateDocument]);

  const lockedByOther = lock !== null && !lockGranted;

  return {
    lockedByOther,
    lockHolderName: lockedByOther ? lock.userName : null,
    remoteChange,
    reloadRemote,
    dismissRemoteChange,
    idlePromptOpen,
    continueEditing,
    lockAutoReleased,
  };
}
