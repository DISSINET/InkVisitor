import { IInvalidDeleteErrorData } from "@inkvisitor/shared/types/errors";

vi.mock("react-toastify", () => ({
  toast: { info: vi.fn(), warning: vi.fn() },
}));

import { toast } from "react-toastify";
import {
  ENTITY_DETAIL_SCROLL_CONTAINER_ID,
  getInvalidDeleteErrorData,
  handleDeleteEntityError,
  resolveDeleteEntityConflict,
  scrollToUsedInSection,
  usedInSectionId,
} from "./deleteEntityConflict";

const addScrollContainer = () => {
  const container = document.createElement("div");
  container.id = ENTITY_DETAIL_SCROLL_CONTAINER_ID;
  const scrollTo = vi.fn();
  (container as unknown as { scrollTo: typeof scrollTo }).scrollTo = scrollTo;
  document.body.append(container);
  return scrollTo;
};

const addUsedInSection = (entityId: string) => {
  const section = document.createElement("div");
  section.id = usedInSectionId(entityId);
  document.body.append(section);
};

const deletedEntityId = "entity-being-deleted";

describe("getInvalidDeleteErrorData", () => {
  it("returns the typed data for a valid InvalidDeleteError", () => {
    const error = {
      error: "InvalidDeleteError",
      message: "nope",
      data: { type: "document", ids: ["doc-1"] } as IInvalidDeleteErrorData,
    };
    expect(getInvalidDeleteErrorData(error)).toEqual({
      type: "document",
      ids: ["doc-1"],
    });
  });

  it("returns null for a different error", () => {
    expect(
      getInvalidDeleteErrorData({ error: "SomethingElse", data: { type: "entity", ids: ["e"] } })
    ).toBeNull();
  });

  it("returns null when data is missing or has no ids", () => {
    expect(getInvalidDeleteErrorData({ error: "InvalidDeleteError" })).toBeNull();
    expect(
      getInvalidDeleteErrorData({ error: "InvalidDeleteError", data: { type: "entity", ids: [] } })
    ).toBeNull();
  });

  it("returns null for null/undefined/non-object input", () => {
    expect(getInvalidDeleteErrorData(null)).toBeNull();
    expect(getInvalidDeleteErrorData(undefined)).toBeNull();
    expect(getInvalidDeleteErrorData("oops")).toBeNull();
  });

  it("preserves the reference discriminant", () => {
    const error = {
      error: "InvalidDeleteError",
      data: { type: "reference", ids: ["e-1"] } as IInvalidDeleteErrorData,
    };
    expect(getInvalidDeleteErrorData(error)).toEqual({
      type: "reference",
      ids: ["e-1"],
    });
  });

  it("collapses an unknown discriminant to entity", () => {
    const error = {
      error: "InvalidDeleteError",
      data: { type: "banana", ids: ["e-1"] },
    };
    expect(getInvalidDeleteErrorData(error)).toEqual({
      type: "entity",
      ids: ["e-1"],
    });
  });
});

describe("resolveDeleteEntityConflict", () => {
  it("opens the first conflicting entity for an entity conflict", () => {
    const data: IInvalidDeleteErrorData = {
      type: "entity",
      ids: ["other-entity-1", "other-entity-2"],
    };
    const result = resolveDeleteEntityConflict(data, deletedEntityId);
    expect(result.targetId).toBe("other-entity-1");
    expect(result.message.toLowerCase()).toContain("entity");
  });

  it("opens the entity being deleted (not the document) for a document conflict", () => {
    const data: IInvalidDeleteErrorData = {
      type: "document",
      ids: ["doc-1", "doc-2"],
    };
    const result = resolveDeleteEntityConflict(data, deletedEntityId);
    // must NOT navigate to a document id - documents are not entities
    expect(result.targetId).toBe(deletedEntityId);
    expect(result.targetId).not.toBe("doc-1");
    expect(result.message.toLowerCase()).toContain("document");
  });

  it("uses singular wording for a single document", () => {
    const result = resolveDeleteEntityConflict(
      { type: "document", ids: ["doc-1"] },
      deletedEntityId
    );
    expect(result.message).toContain("1 document");
    expect(result.message).not.toContain("documents");
  });

  it("uses plural wording for multiple documents", () => {
    const result = resolveDeleteEntityConflict(
      { type: "document", ids: ["doc-1", "doc-2", "doc-3"] },
      deletedEntityId
    );
    expect(result.message).toContain("3 documents");
  });

  it("opens the entity being deleted for a reference conflict", () => {
    const result = resolveDeleteEntityConflict(
      { type: "reference", ids: ["ref-origin-1", "ref-origin-2"] },
      deletedEntityId
    );
    // its own detail's "Used in" reference tables list every blocker
    expect(result.targetId).toBe(deletedEntityId);
    expect(result.message.toLowerCase()).toContain("reference");
  });

  it("uses singular/plural wording for reference conflicts", () => {
    expect(
      resolveDeleteEntityConflict({ type: "reference", ids: ["o1"] }, deletedEntityId)
        .message
    ).toContain("1 entity");
    expect(
      resolveDeleteEntityConflict(
        { type: "reference", ids: ["o1", "o2"] },
        deletedEntityId
      ).message
    ).toContain("2 entities");
  });
});

describe("usedInSectionId", () => {
  it("builds a per-entity section id", () => {
    expect(usedInSectionId("abc")).toBe("entity-detail-used-in-section-abc");
  });
});

describe("scrollToUsedInSection", () => {
  // fake timers so the poll's recursive setTimeout can be discarded after each test
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it("scrolls the container once the entity's section is present", () => {
    const scrollTo = addScrollContainer();
    addUsedInSection("e1");
    scrollToUsedInSection("e1");
    // jsdom reports offsetTop as 0; asserting the scroll happened is the point
    expect(scrollTo).toHaveBeenCalledWith({ behavior: "smooth", top: 0 });
  });

  it("does not scroll while a different entity's section is shown", () => {
    const scrollTo = addScrollContainer();
    addUsedInSection("other");
    scrollToUsedInSection("e1");
    vi.runAllTimers(); // drain the poll; e1 never appears
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("does not throw when nothing is rendered", () => {
    expect(() => {
      scrollToUsedInSection("e1");
      vi.runAllTimers();
    }).not.toThrow();
  });
});

describe("handleDeleteEntityError", () => {
  const documentError = {
    error: "InvalidDeleteError",
    data: { type: "document", ids: ["doc-1"] } as IInvalidDeleteErrorData,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    (toast.info as ReturnType<typeof vi.fn>).mockClear();
    (toast.warning as ReturnType<typeof vi.fn>).mockClear();
    document.body.innerHTML = "";
  });
  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const getOnClick = (toastFn: typeof toast.info) =>
    (toastFn as ReturnType<typeof vi.fn>).mock.calls[0][1].onClick as () => void;

  it("returns false and shows no toast for a non-delete error", () => {
    expect(handleDeleteEntityError({ error: "Other" }, "e1", vi.fn())).toBe(false);
    expect(toast.info).not.toHaveBeenCalled();
    expect(toast.warning).not.toHaveBeenCalled();
  });

  it("on click opens the entity being deleted and scrolls it to used-in for a document conflict", () => {
    const scrollTo = addScrollContainer();
    addUsedInSection("entity-1");
    const appendDetailId = vi.fn();

    const handled = handleDeleteEntityError(documentError, "entity-1", appendDetailId);
    expect(handled).toBe(true);
    expect(toast.info).toHaveBeenCalledTimes(1);
    expect(appendDetailId).not.toHaveBeenCalled(); // nothing until clicked

    getOnClick(toast.info)();

    // document conflict opens the entity being deleted, not the document id
    expect(appendDetailId).toHaveBeenCalledWith("entity-1");
    expect(scrollTo).toHaveBeenCalled();
  });

  it("on click opens the first conflicting entity for an entity conflict (warning variant)", () => {
    addScrollContainer();
    const appendDetailId = vi.fn();
    handleDeleteEntityError(
      { error: "InvalidDeleteError", data: { type: "entity", ids: ["e2", "e3"] } },
      "entity-1",
      appendDetailId,
      "warning"
    );

    expect(toast.warning).toHaveBeenCalledTimes(1);
    expect(() => getOnClick(toast.warning)()).not.toThrow();
    expect(appendDetailId).toHaveBeenCalledWith("e2");
  });
});
