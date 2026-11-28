import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, Rendered } from "../utils/test/renderForTest";
import { Accuracies, useAccuracyList } from "./accuraciesContext";

const api = vi.hoisted(() => ({
  entitiesGet: vi.fn(),
  isLoggedIn: () => true,
}));
vi.mock("api", () => ({ default: api }));

/**
 * What an accuracy is called follows the read of its Concept through the real
 * query: nothing while the read is on its way, its label once it answers, and
 * "cannot be read" once it has failed.
 */

const roles = {
  accuracy: "c-role",
  accuracies: ["c-street"],
  accuracyWhenAgree: "c-street",
  accuracyWhenScattered: "",
};

let result: Accuracies;
const Probe = () => {
  result = useAccuracyList(roles);
  return null;
};

let view: Rendered;
const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });
const mount = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  view = render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
  await settle();
};

beforeEach(() => {
  api.entitiesGet.mockReset();
});
afterEach(() => view?.unmount());

describe("useAccuracyList", () => {
  it("calls an accuracy nothing while its Concept is being read", async () => {
    api.entitiesGet.mockReturnValue(new Promise(() => {}));
    await mount();
    expect(result.labelOf("c-street")).toBe("");
  });

  it("calls an accuracy by its Concept's label once the read answers", async () => {
    api.entitiesGet.mockResolvedValue({ data: [{ id: "c-street", labels: ["to the street"] }] });
    await mount();
    expect(result.labelOf("c-street")).toBe("to the street");
  });

  it("says an accuracy cannot be read once the read has failed", async () => {
    api.entitiesGet.mockRejectedValue(new Error("refused"));
    await mount();
    expect(result.labelOf("c-street")).toBe("an accuracy whose Concept cannot be read");
  });
});
