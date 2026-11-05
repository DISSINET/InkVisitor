import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EngineSuggester } from "../../types/engine";
import { render, Rendered } from "../../utils/test/renderForTest";
import { GazetteerPicker } from "./GazetteerPicker";

/**
 * Each row says what its source covers, how long it usually takes and how much it
 * holds, in the project's settings and in a researcher's own preferences alike,
 * and says only what the engine published.
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

const current: EngineSuggester[] = [
  base("wikidata", {
    latency: { samples: 40, p50Ms: 4800, p95Ms: 12000, failures: 0, meanCandidates: 3.4 },
    info: {
      description: "Structured data.",
      scope: { time: "any period", geography: "worldwide", topic: "anything with a coordinate" },
      size: { records: 12948882, approximate: true, asOf: "2026-11-05", what: "Wikidata items" },
    },
  }),
  base("viabundus", {
    category: "file",
    footprint: { records: 11766, cells: 262 },
    info: {
      description: "A trade network.",
      scope: { time: "1350 to 1650", geography: "northern Europe", topic: "settlements, tolls" },
      size: { records: 11766, approximate: false, what: "Named nodes" },
    },
  }),
];

// an engine from before the scope, size and latency fields
const older: EngineSuggester[] = [
  base("wikidata", { info: { description: "Structured data on anything. Uneven for the medieval." } }),
  base("viabundus", {
    category: "file",
    footprint: { records: 11766, cells: 262 },
    info: { description: "A trade network. Northern Europe." },
  }),
];

const catalogue = vi.hoisted(() => ({ list: [] as unknown[] }));
vi.mock("../../utils/engine/engine", () => ({ engineSuggesters: async () => catalogue.list }));

let view: Rendered | null = null;

const mount = async (list: EngineSuggester[], props: Partial<React.ComponentProps<typeof GazetteerPicker>> = {}) => {
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

afterEach(() => {
  view?.unmount();
  view = null;
});

describe("the facts under a gazetteer's name", () => {
  it("shows scope, speed and size from what the engine published", async () => {
    const { container } = await mount(current);
    const text = container.textContent ?? "";

    expect(text).toContain("any period · worldwide · anything with a coordinate");
    expect(text).toContain("slow · 4.8 s");
    expect(text).toContain("≈ 13 M records");
    expect(text).toContain("northern Europe");
    expect(text).toContain("local");
  });

  it("shows what an older engine gave, and no speed for a service it never measured", async () => {
    const { container } = await mount(older);
    const text = container.textContent ?? "";

    expect(text).toContain("Structured data on anything");
    expect(text).not.toContain("Uneven for the medieval");
    expect(text).toContain("11,766 located records");
    expect(text).not.toMatch(/quick|moderate|slow/);
  });

  it("says the same in the project's table, where further columns sit beside it", async () => {
    const { container } = await mount(current, {
      columns: [{ title: "resource", width: "10em", render: () => <span>resource cell</span> }],
    });
    const text = container.textContent ?? "";

    expect(text).toContain("any period · worldwide · anything with a coordinate");
    expect(text).toContain("slow · 4.8 s");
    expect(text).toContain("resource cell");
  });
});
