import {
  GEOCODING_SETTINGS_KEY,
  GeocodingAccuracy,
  IGeocodingRoles,
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

const { nextBaseUrls, patchGeocodingRoles, putGeocodingRoles, withEntry } = await import(
  "./geocodingSettings",
);

const stored: IGeocodingRoles = {
  x: "c-x",
  y: "c-y",
  accuracy: "c-acc",
  type: "c-type",
  accuracyValues: { [GeocodingAccuracy.Precise]: "v-precise" },
  placeTypes: { settlement: "v-settlement", fortress: "v-fortress" },
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
    const next = withEntry(stored.placeTypes, "settlement", null);
    expect("settlement" in next).toBe(false);
    expect(next.fortress).toBe("v-fortress");
  });

  it("sets the key without touching the others", () => {
    const next = withEntry(stored.resources, "wikidata", "r-other");
    expect(next).toEqual({ wikidata: "r-other", geonames: "r-geonames" });
  });

  it("leaves the map it was given alone", () => {
    withEntry(stored.placeTypes, "settlement", null);
    expect(stored.placeTypes.settlement).toBe("v-settlement");
  });
});

describe("putGeocodingRoles", () => {
  it("writes a dropped place type as dropped", async () => {
    await putGeocodingRoles({
      ...stored,
      placeTypes: withEntry(stored.placeTypes, "settlement", null),
    });
    expect("settlement" in written().placeTypes).toBe(false);
    expect(written().placeTypes.fortress).toBe("v-fortress");
  });

  it("writes a cleared coordinate role as empty", async () => {
    await putGeocodingRoles({ ...stored, x: "" });
    expect(written().x).toBe("");
    expect(written().y).toBe("c-y");
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
  it("merges the maps, so a caller holding one key cannot express a removal", async () => {
    await patchGeocodingRoles({ placeTypes: withEntry(stored.placeTypes, "settlement", null) });
    expect(written().placeTypes.settlement).toBe("v-settlement");
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
