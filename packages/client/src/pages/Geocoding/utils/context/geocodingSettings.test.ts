import {
  GEOCODING_SETTINGS_KEY,
  GeocodingAccuracy,
  IGeocodingRoles,
  defaultPlaceTypes,
} from "@inkvisitor/shared/types/geocoding";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unlinking a role has to survive the write.
 *
 * The modal expresses "nothing is assigned here" by dropping the key, so the
 * only thing that makes the button real is what reaches `settingUpdate`. These
 * tests go through the api module rather than around it, because merging is
 * what the write does and not what the draft does.
 */

const settingGet = vi.fn();
const settingUpdate = vi.fn();

vi.mock("api", () => ({
  default: {
    settingGet: (...args: unknown[]) => settingGet(...args),
    settingUpdate: (...args: unknown[]) => settingUpdate(...args),
  },
}));

const { nextBaseUrls, patchGeocodingContext, patchGeocodingRoles, putGeocodingRoles, withEntry } = await import(
  "./geocodingSettings",
);

const stored: IGeocodingRoles = {
  geometry: "c-geo",
  accuracy: "c-acc",
  accuracyValues: {
    [GeocodingAccuracy.Precise]: "v-precise",
    [GeocodingAccuracy.Approximate]: "v-approx",
  },
  placeTypes: [
    { ...defaultPlaceTypes()[0], conceptId: "v-settlement" },
    { ...defaultPlaceTypes()[1], conceptId: "v-fortress" },
  ],
  resources: { wikidata: "r-wikidata", geonames: "r-geonames" },
};

const written = (): IGeocodingRoles => settingUpdate.mock.calls[0][1].value.roles;

beforeEach(() => {
  settingGet.mockReset();
  settingUpdate.mockReset();
  settingGet.mockResolvedValue({ data: { data: { value: { roles: stored, context: {} } } } });
  settingUpdate.mockResolvedValue(undefined);
});

describe("withEntry", () => {
  it("removes the key rather than blanking it, so a reader asking whether it exists is told no", () => {
    const next = withEntry(stored.accuracyValues, GeocodingAccuracy.Precise, null);
    expect(GeocodingAccuracy.Precise in next).toBe(false);
    expect(next[GeocodingAccuracy.Approximate]).toBe("v-approx");
  });

  it("sets the key without touching the others", () => {
    const next = withEntry(stored.resources, "wikidata", "r-other");
    expect(next).toEqual({ wikidata: "r-other", geonames: "r-geonames" });
  });

  it("leaves the map it was given alone", () => {
    withEntry(stored.accuracyValues, GeocodingAccuracy.Precise, null);
    expect(stored.accuracyValues[GeocodingAccuracy.Precise]).toBe("v-precise");
  });
});

describe("putGeocodingRoles", () => {
  it("writes the list of place types as given, a removed kind gone and a new one present", async () => {
    await putGeocodingRoles({
      ...stored,
      placeTypes: [
        stored.placeTypes[1],
        { ...defaultPlaceTypes()[0], id: "catholic-church", name: "catholic church", conceptId: "c-cc" },
      ],
    });
    expect(written().placeTypes.map((one) => one.id)).toEqual(["fortress", "catholic-church"]);
    expect(written().placeTypes[1].conceptId).toBe("c-cc");
  });

  it("writes a cleared geometry role as empty", async () => {
    await putGeocodingRoles({ ...stored, geometry: "" });
    expect(written().geometry).toBe("");
    expect(written().accuracy).toBe("c-acc");
  });

  it("writes a dropped gazetteer resource as dropped", async () => {
    await putGeocodingRoles({
      ...stored,
      resources: withEntry(stored.resources, "wikidata", null),
    });
    expect("wikidata" in written().resources).toBe(false);
    expect(written().resources.geonames).toBe("r-geonames");
  });

  it("keeps the query context, which it does not own", async () => {
    settingGet.mockResolvedValue({
      data: { data: { value: { roles: stored, context: { region: "Silesia" } } } },
    });
    await putGeocodingRoles(stored);
    expect(settingUpdate.mock.calls[0][0]).toBe(GEOCODING_SETTINGS_KEY);
    expect(settingUpdate.mock.calls[0][1].value.context).toEqual({ region: "Silesia" });
  });
});

describe("patchGeocodingRoles", () => {
  it("merges the keyed maps, so a caller holding one key cannot express a removal", async () => {
    await patchGeocodingRoles({
      accuracyValues: withEntry(stored.accuracyValues, GeocodingAccuracy.Precise, null),
    });
    expect(written().accuracyValues[GeocodingAccuracy.Precise]).toBe("v-precise");
  });

  it("replaces the list of place types whole", async () => {
    await patchGeocodingRoles({ placeTypes: [stored.placeTypes[1]] });
    expect(written().placeTypes.map((one) => one.id)).toEqual(["fortress"]);
  });

  it("reads a row written before the list existed as the default list with its Concepts", async () => {
    settingGet.mockResolvedValue({
      data: {
        data: {
          value: {
            roles: { ...stored, placeTypes: { settlement: "old-settlement", river: "old-river" } },
            context: {},
          },
        },
      },
    });
    await patchGeocodingRoles({ geometry: "c-geo-2" });
    const kinds = written().placeTypes;
    expect(kinds).toHaveLength(12);
    expect(kinds.find((one) => one.id === "settlement")?.conceptId).toBe("old-settlement");
    expect(kinds.find((one) => one.id === "river")?.conceptId).toBe("old-river");
    expect(kinds.find((one) => one.id === "lake")?.conceptId).toBe("");
  });
});

describe("patchGeocodingContext", () => {
  it("starts from empty settings where no row exists yet", async () => {
    settingGet.mockRejectedValue({ response: { status: 404 } });
    await patchGeocodingContext({ disabledSources: ["tgn"] });
    expect(settingUpdate.mock.calls[0][1].value.context).toEqual({ disabledSources: ["tgn"] });
  });

  it("writes nothing where the read failed for any other reason, so stored roles are not replaced", async () => {
    settingGet.mockRejectedValue({ response: { status: 500 } });
    await expect(patchGeocodingContext({ disabledSources: ["tgn"] })).rejects.toBeDefined();
    expect(settingUpdate).not.toHaveBeenCalled();
  });
});

describe("nextBaseUrls", () => {
  it("drops the URL when the row is unlinked, so the save writes nothing for that source", () => {
    const next = nextBaseUrls({ wikidata: "https://typed.example/" }, "wikidata", null, "https://known.example/");
    expect("wikidata" in next).toBe(false);
  });

  it("does not carry a URL from the entity that was unlinked onto the one attached next", () => {
    const unlinked = nextBaseUrls({ tgn: "https://typed.example/" }, "tgn", null, "https://known.example/");
    const relinked = nextBaseUrls(unlinked, "tgn", "r-new", "https://known.example/");
    expect(relinked.tgn).toBe("https://known.example/");
  });

  it("leaves a source with no published record URL blank", () => {
    expect(nextBaseUrls({}, "whg", "r-whg", undefined)).toEqual({});
  });

  it("leaves the other sources alone", () => {
    const next = nextBaseUrls({ tgn: "https://tgn.example/" }, "wikidata", "r-w", "https://w.example/");
    expect(next.tgn).toBe("https://tgn.example/");
  });
});
