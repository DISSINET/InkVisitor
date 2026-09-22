import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GeocodingContextPanel } from "./GeocodingContextPanel";
import { click, render, Rendered } from "./renderForTest";

/**
 * The query context, on screen and editable.
 *
 * The engine is unreachable in these, which is a state the panel has to work in
 * anyway: it means the vocabularies are absent, so a field is named by the id it
 * holds rather than by a label.
 */

let view: Rendered | null = null;

const mount = (
  props: Partial<React.ComponentProps<typeof GeocodingContextPanel>> = {},
) => {
  const onChange = vi.fn();
  const onLanguagesChange = vi.fn();
  const onWeightChange = vi.fn();
  const onReset = vi.fn();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  view = render(
    <QueryClientProvider client={client}>
      <GeocodingContextPanel
        context={{ region: "europe" }}
        projectContext={{}}
        onChange={onChange}
        onLanguagesChange={onLanguagesChange}
        onWeightChange={onWeightChange}
        onReset={onReset}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { onChange, onLanguagesChange, onWeightChange, onReset };
};

const globals = () =>
  view!.all("button").filter((node) => node.textContent?.startsWith("project default"));

afterEach(() => {
  view?.unmount();
  view = null;
});

describe("the project's own value", () => {
  it("is named beside a field the researcher has overridden", () => {
    mount({ context: { region: "occitania" }, projectContext: { region: "europe" } });
    expect(globals().map((node) => node.textContent)).toEqual(["project default: europe"]);
  });

  it("is dropped by pressing it, which clears the personal value", () => {
    // an empty personal value is what the layering reads as "nothing said
    // here", and that is what lets the project's own answer back through
    const { onChange } = mount({
      context: { region: "occitania" },
      projectContext: { region: "europe" },
    });
    click(globals()[0]);
    expect(onChange).toHaveBeenCalledWith("region", "");
  });

  it("is not named where the project says nothing", () => {
    // a project that sets no region is not being overridden by one that carries
    // a value - it is silent, and there is nothing to go back to
    mount({ context: { region: "europe" }, projectContext: {} });
    expect(globals()).toHaveLength(0);
  });

  it("is not named where the field already agrees with it", () => {
    mount({ context: { region: "europe" }, projectContext: { region: "europe" } });
    expect(globals()).toHaveLength(0);
  });

  it("offers to return every field at once, only while one departs", () => {
    mount({ context: { region: "europe" }, projectContext: { region: "europe" } });
    expect(view!.texts("button")).not.toContain("use the project's defaults");
    view!.unmount();
    mount({ context: { region: "occitania" }, projectContext: { region: "europe" } });
    expect(view!.texts("button")).toContain("use the project's defaults");
  });
});

describe("asking again", () => {
  it("offers it only when the answer on screen was found under another question", () => {
    mount();
    expect(view!.texts("button")).not.toContain("regeocode");
    view!.unmount();
    const onRegeocode = vi.fn();
    mount({ onRegeocode });
    const button = view!.all("button").find((node) => node.textContent?.includes("regeocode"));
    click(button || null);
    expect(onRegeocode).toHaveBeenCalled();
  });
});
