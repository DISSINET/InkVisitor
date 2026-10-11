import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EngineSuggester } from "../../types/engine";
import { GazetteerHover, GazetteerTag } from "./GazetteerTag";
import { render, Rendered } from "../../utils/test/renderForTest";

/**
 * A gazetteer's tag is the one place the page explains a source, so what matters
 * is that it explains what the engine said and stays out of the way where the
 * engine said nothing.
 */

const suggester = (name: string): EngineSuggester => ({
  name,
  category: "file",
  coverage: { regions: ["low-countries"], languages: ["de"] },
  health: { status: "ready" },
  weight: { default: 0.85, min: 0.5 },
  footprint: { records: 11766, cells: 262 },
  info: {
    description: "A gazetteer of the Hanseatic trade network.",
    limitations: "Places off the trade routes are absent.",
    license: {
      id: "CC-BY-SA-4.0",
      label: "CC BY-SA 4.0",
      commercialUse: "yes",
      shareAlike: true,
      attribution: true,
    },
  },
});

const catalogue = vi.hoisted(() => ({ list: [] as unknown[] | Error }));
vi.mock("../../utils/engine/engine", () => ({
  engineSuggesters: async () => {
    if (catalogue.list instanceof Error) {
      throw catalogue.list;
    }
    return catalogue.list;
  },
}));

let view: Rendered | null = null;

const mount = async (element: React.ReactElement) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  view = render(<QueryClientProvider client={client}>{element}</QueryClientProvider>);
  // the catalogue is fetched once the tag is mounted; a few short turns let the
  // query settle however loaded the machine running the suite is
  for (let turn = 0; turn < 10; turn++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
};

afterEach(() => {
  view?.unmount();
  view = null;
  document.body.innerHTML = "";
});

describe("GazetteerTag", () => {
  it("shows what the engine says about the source when the pointer is over it", async () => {
    catalogue.list = [suggester("viabundus")];
    await mount(<GazetteerTag source="viabundus" />);
    expect(document.body.textContent).not.toContain("Hanseatic");

    const anchor = view!.container.firstElementChild as HTMLElement;
    await act(async () => {
      // React derives mouseenter from mouseover
      anchor.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    const text = document.body.textContent ?? "";
    expect(text).toContain("A gazetteer of the Hanseatic trade network.");
    expect(text).toContain("low countries");
    expect(text).toContain("German");
    expect(text).toContain("Places off the trade routes are absent.");
    expect(text).toContain("commercial use allowed");
  });

  it("marks the kind of source with an icon beside its name, a different one for each kind", async () => {
    const shapeOf = async (name: string, category: "file" | "service") => {
      catalogue.list = [{ ...suggester(name), category }];
      await mount(<GazetteerTag source={name} />);
      const svg = view!.container.querySelector("svg");
      const path = svg?.innerHTML ?? "";
      view!.unmount();
      return path;
    };
    const records = await shapeOf("viabundus", "file");
    const service = await shapeOf("geonames", "service");
    const model = await shapeOf("llm-coords", "service");
    expect(records).not.toBe("");
    expect(new Set([records, service, model]).size).toBe(3);
  });

  it("is the bare name, with nothing to hover, where the engine has not heard of the source", async () => {
    catalogue.list = [suggester("viabundus")];
    await mount(<GazetteerTag source="not-a-source" />);
    expect(view!.container.textContent).toBe("not-a-source");
    expect(view!.container.querySelector("svg")).toBeNull();
    const anchor = view!.container.querySelector("span") as HTMLElement;
    await act(async () => {
      anchor.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
    });
    expect(document.body.textContent).not.toContain("Hanseatic");
  });

  it("keeps the face the caller draws, whether or not the engine could be reached", async () => {
    catalogue.list = new Error("unreachable");
    await mount(
      <GazetteerHover source="viabundus">
        <b>my own face</b>
      </GazetteerHover>,
    );
    expect(view!.container.innerHTML).toBe("<b>my own face</b>");
  });
});
