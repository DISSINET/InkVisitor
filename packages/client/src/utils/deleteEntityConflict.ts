import { IInvalidDeleteErrorData } from "@inkvisitor/shared/types/errors";
import { toast, ToastOptions } from "react-toastify";

/**
 * Narrows an unknown delete-mutation error to the typed payload carried by an
 * InvalidDeleteError, or returns null when the error is not a (usable) delete
 * conflict. The server stuffs entity ids OR document ids into `data.ids`, and
 * `data.type` discriminates between them.
 */
export const getInvalidDeleteErrorData = (
  error: unknown
): IInvalidDeleteErrorData | null => {
  if (!error || typeof error !== "object") {
    return null;
  }
  const { error: errorName, data } = error as {
    error?: string;
    data?: Partial<IInvalidDeleteErrorData>;
  };
  if (
    errorName !== "InvalidDeleteError" ||
    !data ||
    !Array.isArray(data.ids) ||
    data.ids.length === 0
  ) {
    return null;
  }
  return { type: data.type === "document" ? "document" : "entity", ids: data.ids };
};

export interface DeleteEntityConflict {
  /** id to open in the entity detail panel when the toast is clicked */
  targetId: string;
  /** message describing why the deletion was blocked */
  message: string;
}

/** CustomScrollbar wrapper id of the entity detail (`scrollerId`). */
export const ENTITY_DETAIL_SCROLLBAR_ID = "entity-detail-scrollbar";
/** Scrollable entity-detail container id (CustomScrollbar `elementId`). */
export const ENTITY_DETAIL_SCROLL_CONTAINER_ID = "entity-detail-box-content";
/** Id of an entity's "Used in" section — per entity so a scroll waits for the right detail. */
export const usedInSectionId = (entityId: string) =>
  `entity-detail-used-in-section-${entityId}`;

/**
 * Scrolls the entity detail to `entityId`'s "Used in" section. Opening the detail
 * is asynchronous, so this polls (up to ~3s) until that entity's section is
 * rendered, then scrolls its container into view. No-op if it never appears.
 */
export const scrollToUsedInSection = (entityId: string): void => {
  let attempts = 0;
  const tick = () => {
    const container = document.getElementById(ENTITY_DETAIL_SCROLL_CONTAINER_ID);
    const section = document.getElementById(usedInSectionId(entityId));
    if (container && section) {
      container.scrollTo({ behavior: "smooth", top: section.offsetTop });
    } else if (attempts++ < 30) {
      setTimeout(tick, 100);
    }
  };
  tick();
};

/**
 * Decides what to surface when an entity delete is blocked by an
 * InvalidDeleteError:
 * - "entity" conflicts -> open the first conflicting entity in detail.
 * - "document" conflicts -> open the entity the user tried to delete; its
 *   detail "Used in documents" table is where the blocking anchors can be
 *   removed. Document ids are NOT entities and cannot be opened in entity
 *   detail (doing so was the original bug).
 */
export const resolveDeleteEntityConflict = (
  data: IInvalidDeleteErrorData,
  deletedEntityId: string
): DeleteEntityConflict => {
  if (data.type === "document") {
    const count = data.ids.length;
    return {
      targetId: deletedEntityId,
      message: `Cannot delete — anchored to ${count} document${
        count === 1 ? "" : "s"
      }. Click to review anchors in detail.`,
    };
  }
  return {
    targetId: data.ids[0],
    message: "Click to open the conflicting entity in detail",
  };
};

/**
 * Shows the appropriate toast for a blocked entity deletion and wires its click
 * to open the right entity in detail and scroll it to its "Used in" section
 * (where the blocking anchors/references can be removed). Returns true when the
 * error was a handled InvalidDeleteError, false otherwise (so callers can fall
 * back to a generic error toast).
 */
export const handleDeleteEntityError = (
  error: unknown,
  deletedEntityId: string,
  appendDetailId: (id: string) => void,
  variant: "info" | "warning" = "info"
): boolean => {
  const data = getInvalidDeleteErrorData(error);
  if (!data) {
    return false;
  }
  const { targetId, message } = resolveDeleteEntityConflict(data, deletedEntityId);
  const options: ToastOptions = {
    autoClose: 6000,
    onClick: () => {
      appendDetailId(targetId);
      scrollToUsedInSection(targetId);
    },
  };
  if (variant === "warning") {
    toast.warning(message, options);
  } else {
    toast.info(message, options);
  }
  return true;
};
