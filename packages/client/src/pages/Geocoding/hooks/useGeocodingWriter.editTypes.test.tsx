import { RelationEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import { IGeocodingRoles, defaultPlaceTypes } from "@inkvisitor/shared/types/geocoding";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, Rendered } from "../utils/test/renderForTest";
import { PLACE_TYPE_ASSIGNMENTS_KEY } from "./usePlaceTypeAssignments";
import { UseGeocodingWriter, useGeocodingWriter } from "./useGeocodingWriter";

const api = vi.hoisted(() => ({
  relationsGet: vi.fn(),
  relationCreate: vi.fn(),
  relationDelete: vi.fn(),
  entityUpdate: vi.fn(),
  entityCreate: vi.fn(),
  entityDelete: vi.fn(),
  entitiesGet: vi.fn(),
}));
const toasts = vi.hoisted(() => ({ error: vi.fn(), warn: vi.fn(), success: vi.fn(), info: vi.fn() }));
vi.mock("api", () => ({ default: api }));
vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-toastify")>()),
  toast: toasts,
}));

/**
 * Setting a location type writes Classifications and nothing else. It has to work
 * for a Location with no coordinate, never create or change a prop, and say so
 * where it cannot write.
 */

const roles: IGeocodingRoles = {
  geometry: "c-geo",
  accuracy: "c-acc",
  epistemicSource: "",
  accuracyValues: {},
  placeTypes: [
    { ...defaultPlaceTypes()[0], id: "settlement", name: "settlement", conceptId: "c-settlement" },
    { ...defaultPlaceTypes()[1], id: "fortress", name: "fortress", conceptId: "c-fortress" },
    { ...defaultPlaceTypes()[2], id: "church", name: "church", conceptId: "" },
  ],
  resources: {},
};

const location = { id: "L1", labels: ["Breslau"], props: [] } as unknown as IEntity;
const classification = (id: string, concept: string) => ({
  id,
  type: RelationEnums.Type.Classification,
  entityIds: ["L1", concept],
});

let writer: UseGeocodingWriter;
const Probe = () => {
  writer = useGeocodingWriter(roles);
  return null;
};
let view: Rendered;
let invalidated: unknown[];

beforeEach(() => {
  Object.values(api).forEach((fn) => fn.mockReset());
  Object.values(toasts).forEach((fn) => fn.mockReset());
  api.relationsGet.mockResolvedValue({ data: [classification("r1", "c-fortress")] });
  api.relationCreate.mockResolvedValue(undefined);
  api.relationDelete.mockResolvedValue(undefined);
  const client = new QueryClient();
  invalidated = [];
  client.invalidateQueries = ((filters: unknown) => {
    invalidated.push(filters);
    return Promise.resolve();
  }) as never;
  view = render(
    <QueryClientProvider client={client}>
      <Probe />
    </QueryClientProvider>,
  );
});
afterEach(() => view.unmount());

describe("editTypes", () => {
  it("adds a location type as a Classification and leaves the ones the Location has", async () => {
    let written = false;
    await act(async () => {
      written = await writer.editTypes(location, { add: ["settlement"] });
    });
    expect(written).toBe(true);
    expect(api.relationCreate).toHaveBeenCalledTimes(1);
    expect(api.relationCreate.mock.calls[0][0]).toMatchObject({
      type: RelationEnums.Type.Classification,
      entityIds: ["L1", "c-settlement"],
    });
    expect(api.relationDelete).not.toHaveBeenCalled();
  });

  it("removes only the Classification of the location type it is told to", async () => {
    await act(async () => {
      await writer.editTypes(location, { remove: ["fortress"] });
    });
    expect(api.relationDelete).toHaveBeenCalledWith("r1");
    expect(api.relationCreate).not.toHaveBeenCalled();
  });

  it("writes no prop and no entity, so a Location with no coordinate takes a location type", async () => {
    await act(async () => {
      await writer.editTypes(location, { add: ["settlement"] });
    });
    expect(api.entityUpdate).not.toHaveBeenCalled();
    expect(api.entityCreate).not.toHaveBeenCalled();
    expect(api.entityDelete).not.toHaveBeenCalled();
  });

  it("removes every one the page can where told to clear", async () => {
    api.relationsGet.mockResolvedValue({
      data: [classification("r1", "c-fortress"), classification("r2", "c-settlement"), classification("r3", "c-other")],
    });
    await act(async () => {
      await writer.editTypes(location, { clear: true });
    });
    expect(api.relationDelete.mock.calls.map((call) => call[0]).sort()).toEqual(["r1", "r2"]);
  });

  it("refuses a location type with no Concept, and writes nothing", async () => {
    let written = true;
    await act(async () => {
      written = await writer.editTypes(location, { add: ["church"] });
    });
    expect(written).toBe(false);
    expect(toasts.error.mock.calls[0][0]).toContain('"church"');
    expect(api.relationsGet).not.toHaveBeenCalled();
    expect(api.relationCreate).not.toHaveBeenCalled();
  });

  it("says that it could not write, naming the place, and resolves to false", async () => {
    api.relationCreate.mockRejectedValue(new Error("no"));
    let written = true;
    await act(async () => {
      written = await writer.editTypes(location, { add: ["settlement"] });
    });
    expect(written).toBe(false);
    expect(toasts.error.mock.calls[0][0]).toContain("Breslau");
  });

  it("refreshes what the Locations come under, unless it is one of a run that does so once", async () => {
    await act(async () => {
      await writer.editTypes(location, { add: ["settlement"] });
    });
    expect(invalidated).toEqual([{ queryKey: [PLACE_TYPE_ASSIGNMENTS_KEY] }]);
    invalidated.length = 0;
    await act(async () => {
      await writer.editTypes(location, { add: ["settlement"] }, { quiet: true });
    });
    expect(invalidated).toEqual([]);
  });
});
