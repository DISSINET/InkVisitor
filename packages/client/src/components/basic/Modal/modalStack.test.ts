import { describe, expect, it } from "vitest";
import { isTopmostModal, pushModal, removeModal } from "./modalStack";

// the stack is module state shared by every Modal, so each test cleans up the
// ids it opened
const withModals = <T>(ids: symbol[], assert: () => T): T => {
  ids.forEach(pushModal);
  try {
    return assert();
  } finally {
    ids.forEach(removeModal);
  }
};

describe("modalStack", () => {
  it("treats the last opened modal as the topmost one", () => {
    const batch = Symbol("batch");
    const confirm = Symbol("confirm");

    withModals([batch, confirm], () => {
      expect(isTopmostModal(confirm)).toBe(true);
      expect(isTopmostModal(batch)).toBe(false);
    });
  });

  it("hands the top back to the modal underneath when the top closes", () => {
    const batch = Symbol("batch");
    const confirm = Symbol("confirm");

    withModals([batch], () => {
      pushModal(confirm);
      removeModal(confirm);

      expect(isTopmostModal(batch)).toBe(true);
    });
  });

  it("keeps the top when a modal below it closes", () => {
    const first = Symbol("first");
    const second = Symbol("second");
    const third = Symbol("third");

    withModals([first, second, third], () => {
      removeModal(second);

      expect(isTopmostModal(third)).toBe(true);
    });
  });

  it("ignores an id that is not open", () => {
    const open = Symbol("open");
    const never = Symbol("never");

    withModals([open], () => {
      removeModal(never);

      expect(isTopmostModal(open)).toBe(true);
    });
  });

  it("reports no topmost modal once every modal has closed", () => {
    const only = Symbol("only");

    pushModal(only);
    removeModal(only);

    expect(isTopmostModal(only)).toBe(false);
  });
});
