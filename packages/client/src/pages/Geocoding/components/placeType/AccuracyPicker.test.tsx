import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Accuracies, AccuraciesProvider } from "../../hooks/accuraciesContext";
import { click, render, Rendered } from "../../utils/test/renderForTest";
import { AccuracyPicker } from "./AccuracyPicker";

// the tag as its label, so the test reads what a researcher reads, and the
// props it was given, so the test can see what it was told not to do
const tagProps = vi.hoisted(() => [] as Record<string, unknown>[]);
vi.mock("components/advanced", async (importOriginal) => ({
  ...(await importOriginal<typeof import("components/advanced")>()),
  EntityTag: (props: { entity: { labels: string[] } }) => {
    tagProps.push(props);
    return <b data-tag>{props.entity.labels[0]}</b>;
  },
}));

const accuracies = (
  entries: Accuracies["entries"],
  roleConcept?: Accuracies["roleConcept"],
): Accuracies => ({
  entries,
  whenAgree: "",
  whenScattered: "",
  roleConcept,
  labelOf: (accuracy) => accuracy ?? "",
});
const entry = (conceptId: string, label: string, detail = "") => ({
  conceptId,
  label,
  detail,
  entity: { id: conceptId, labels: [label] } as never,
});

let view: Rendered | null = null;
afterEach(() => {
  view?.unmount();
  view = null;
  document.body.innerHTML = "";
});

const mount = (value: Accuracies, props: Partial<React.ComponentProps<typeof AccuracyPicker>> = {}) => {
  const onChoose = vi.fn();
  view = render(
    <AccuraciesProvider value={value}>
      <AccuracyPicker
        anchor={{ left: 10, top: 10, bottom: 30 }}
        onChoose={onChoose}
        onClose={() => undefined}
        {...props}
      />
    </AccuraciesProvider>,
  );
  return onChoose;
};
const options = () => [...document.querySelectorAll<HTMLElement>("[role=option]")];

describe("AccuracyPicker", () => {
  it("offers the project's accuracies in its order, each as its Concept's tag alone, without its detail", () => {
    mount(
      accuracies([
        entry("c-street", "to the street", "The point is the place."),
        entry("c-town", "to the town"),
      ]),
    );
    expect(options().map((one) => one.querySelector("[data-tag]")?.textContent)).toEqual([
      "to the street",
      "to the town",
    ]);
    expect(options()[0].textContent).toBe("to the street");
  });

  const header = () => document.querySelector("[role=dialog]")!.firstElementChild as HTMLElement;

  it("heads the list with what is asked, the Concept it is recorded as, and the note, outside the options", () => {
    mount(accuracies([entry("c-street", "to the street")], { id: "c-acc", labels: ["geo:accuracy"] } as never), {
      note: "new location · 48.01439, 11.82422",
    });
    expect(header().getAttribute("role")).toBeNull();
    expect(header().textContent).toBe("accuracyrecorded asgeo:accuracynew location · 48.01439, 11.82422");
    expect(header().querySelector("[data-tag]")?.textContent).toBe("geo:accuracy");
    expect(document.querySelector("[role=listbox]")!.textContent).not.toContain("geo:accuracy");
  });

  it("says plain accuracy where the tag would be while no Concept is assigned for it, or it has not loaded", () => {
    mount(accuracies([entry("c-street", "to the street")]));
    const heading = header().querySelector<HTMLElement>("[data-hint]")!;
    expect(heading.textContent).toBe("accuracy");
    expect(heading.querySelector("[data-tag]")).toBeNull();
  });

  it("draws every tag, heading included, with its tooltip on and its own click, drag and menu off", () => {
    tagProps.length = 0;
    mount(accuracies([entry("c-street", "to the street")], { id: "c-acc", labels: ["geo:accuracy"] } as never));
    const byEntity = new Map(tagProps.map((props) => [(props.entity as { id: string }).id, props]));
    expect([...byEntity.keys()].sort()).toEqual(["c-acc", "c-street"]);
    for (const props of byEntity.values()) {
      expect(props).toMatchObject({
        disableTooltip: false,
        tooltipPassThrough: true,
        disableDrag: true,
        disableCopyToClipboard: true,
        disableDoubleClick: true,
        disableContextMenu: true,
      });
    }
  });

  it("draws the tag of the option the pointer is over selected, and only while it is there", () => {
    mount(accuracies([entry("c-street", "to the street"), entry("c-town", "to the town")]));
    const selectedOf = (id: string) =>
      tagProps.filter((props) => (props.entity as { id: string }).id === id).at(-1)?.isSelected;
    // the list puts the focus on its first option, which jsdom, unlike a browser
    // after a click, counts as the keyboard's; taken away so only the pointer counts
    act(() => (document.activeElement as HTMLElement).blur());
    expect(selectedOf("c-street")).toBeFalsy();
    expect(selectedOf("c-town")).toBeFalsy();
    act(() => {
      options()[1].dispatchEvent(new MouseEvent("mouseenter"));
    });
    expect(selectedOf("c-town")).toBe(true);
    expect(selectedOf("c-street")).toBeFalsy();
    act(() => {
      options()[1].dispatchEvent(new MouseEvent("mouseleave"));
    });
    expect(selectedOf("c-town")).toBeFalsy();
  });

  it("chooses an accuracy by its Concept", () => {
    const onChoose = mount(accuracies([entry("c-street", "to the street"), entry("c-town", "to the town")]));
    click(options()[1]);
    expect(onChoose).toHaveBeenCalledWith("c-town");
  });

  it("marks the one the sources argue for and the one that stands", () => {
    mount(accuracies([entry("c-street", "to the street"), entry("c-town", "to the town")]), {
      suggested: "c-town",
      current: "c-street",
    });
    // on the tag's own line
    expect(options()[1].querySelector("[data-tag]")!.parentElement!.textContent).toBe(
      "to the townwhat its sources argue for",
    );
    expect(options()[0].getAttribute("aria-selected")).toBe("true");
  });

  it("says where accuracies are set when the project lists none", () => {
    mount(accuracies([]));
    expect(options()).toHaveLength(0);
    expect(document.body.textContent).toContain("Global geocoding");
  });
});
