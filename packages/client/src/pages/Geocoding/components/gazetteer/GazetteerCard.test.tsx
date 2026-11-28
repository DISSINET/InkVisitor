import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EngineSuggester } from "../../types/engine";
import { render, Rendered } from "../../utils/test/renderForTest";
import { GazetteerCard } from "./GazetteerCard";
import { GazetteerPicker } from "./GazetteerPicker";

/**
 * A gazetteer's row in the settings names the source; its card, on hover, says
 * what the engine published about it, with what decides whether to ask the
 * source before the terms of use and the description.
 */

const base = (name: string, over: Partial<EngineSuggester> = {}): EngineSuggester => ({
  name,
  category: "service",
  coverage: {},
  health: { status: "ready" },
  weight: { default: 0.85, min: 0.5 },
  footprint: null,
  info: { description: "A gazetteer of something." },
  ...over,
});

const wikidata = base("wikidata", {
  latency: { samples: 40, p50Ms: 4800, p95Ms: 12000, failures: 0, meanCandidates: 3.4 },
  info: {
    description: "Structured data on anything.",
    scope: { time: "any period", geography: "worldwide", topic: "anything with a coordinate" },
    size: { records: 12948882, approximate: true, asOf: "2026-11-05", what: "Wikidata items" },
    limitations: "Uneven for the medieval.",
    license: {
      id: "CC0-1.0",
      label: "CC0 1.0 Universal",
      commercialUse: "yes",
      shareAlike: false,
      attribution: false,
    },
  },
});

const viabundus = base("viabundus", {
  category: "file",
  footprint: { records: 11766, cells: 262 },
  info: {
    description: "A trade network.",
    scope: { time: "1350 to 1650", geography: "northern Europe", topic: "settlements, tolls" },
    size: { records: 11766, approximate: false, what: "Named nodes" },
  },
});

// an engine from before the scope, size and latency fields
const olderWikidata = base("wikidata", {
  info: { description: "Structured data on anything. Uneven for the medieval." },
});
const olderViabundus = base("viabundus", {
  category: "file",
  footprint: { records: 11766, cells: 262 },
  info: { description: "A trade network. Northern Europe." },
});

let view: Rendered | null = null;

afterEach(() => {
  view?.unmount();
  view = null;
});

const cardText = (suggester: EngineSuggester): string => {
  view = render(<GazetteerCard suggester={suggester} />);
  return view.container.textContent ?? "";
};

describe("a gazetteer's card", () => {
  it("opens with what the source covers, how long it takes and how much it holds", () => {
    const text = cardText(wikidata);
    const at = (part: string) => text.indexOf(part);
    for (const first of ["any period · worldwide · anything with a coordinate", "slow · 4.8 s", "≈ 13 M records"]) {
      expect(at(first)).toBeGreaterThanOrEqual(0);
      expect(at(first)).toBeLessThan(at("good for"));
    }
  });

  it("puts the limitations before the terms of use, and both before the description", () => {
    const text = cardText(wikidata);
    const at = (part: string) => text.indexOf(part);
    expect(at("any period")).toBeGreaterThanOrEqual(0);
    expect(at("any period")).toBeLessThan(at("Uneven for the medieval"));
    expect(at("Uneven for the medieval")).toBeLessThan(at("CC0 1.0 Universal"));
    expect(at("CC0 1.0 Universal")).toBeLessThan(at("Structured data on anything"));
  });

  it("opens an older engine's card with the description's first sentence, and says it once", () => {
    const text = cardText(olderWikidata);
    expect(text.indexOf("Structured data on anything")).toBeLessThan(text.indexOf("good for"));
    expect(text.split("Structured data on anything")).toHaveLength(2);
    expect(text).toContain("Uneven for the medieval");
  });

  it("shows no speed for a service the engine never measured", () => {
    expect(cardText(olderWikidata)).not.toMatch(/quick|moderate|slow/);
  });

  it("counts the located records of a local file where the engine publishes no size", () => {
    expect(cardText(olderViabundus)).toContain("11,766 located records");
  });

  it("names a source the engine says cannot answer, and why", () => {
    const text = cardText(base("tgn", { health: { status: "down", reason: "unreachable" } }));
    expect(text.indexOf("unreachable")).toBeGreaterThanOrEqual(0);
    expect(text.indexOf("unreachable")).toBeLessThan(text.indexOf("good for"));
  });
});

const catalogue = vi.hoisted(() => ({ list: [] as unknown[] }));
vi.mock("../../utils/engine/engine", () => ({ engineSuggesters: async () => catalogue.list }));

const mountPicker = async (
  list: EngineSuggester[],
  props: Partial<React.ComponentProps<typeof GazetteerPicker>> = {},
) => {
  catalogue.list = list;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  view = render(
    <QueryClientProvider client={client}>
      <GazetteerPicker disabled={[]} onChange={() => {}} {...props} />
    </QueryClientProvider>,
  );
  for (let turn = 0; turn < 10; turn++) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
    });
  }
  return view;
};

describe("a gazetteer's row", () => {
  it("names the source and leaves what it covers, its speed and its size to the card", async () => {
    const tgnDown = base("tgn", { health: { status: "down", reason: "unreachable" } });
    const { container } = await mountPicker([wikidata, viabundus, tgnDown], {
      columns: [{ title: "resource", width: "10em", render: () => <span>resource cell</span> }],
    });
    const text = container.textContent ?? "";
    // read from the engine's catalogue, so the facts below are absent from a loaded one
    expect(text).toContain("unreachable");
    expect(text).toContain("resource cell");
    expect(text).not.toContain("any period");
    expect(text).not.toContain("slow · 4.8 s");
    expect(text).not.toContain("records");
  });
});
