import "ts-jest";
import { RequestSearch } from "@inkvisitor/shared/types/request-search";

describe("RequestSearch.includeEquivalents coercion", () => {
  test("boolean true stays true", () => {
    expect(new RequestSearch({ includeEquivalents: true }).includeEquivalents).toBe(
      true
    );
  });

  test("boolean false stays false", () => {
    expect(
      new RequestSearch({ includeEquivalents: false }).includeEquivalents
    ).toBe(false);
  });

  test('string "true" (GET query param) becomes true', () => {
    expect(
      new RequestSearch({ includeEquivalents: "true" as unknown as boolean })
        .includeEquivalents
    ).toBe(true);
  });

  test('string "false" (GET query param) must NOT become true', () => {
    expect(
      new RequestSearch({ includeEquivalents: "false" as unknown as boolean })
        .includeEquivalents
    ).toBe(false);
  });

  test("omitted defaults to false", () => {
    expect(new RequestSearch({}).includeEquivalents).toBe(false);
  });
});

describe("RequestSearch.includeSubordinates coercion", () => {
  test('string "false" (GET query param) must NOT become true', () => {
    expect(
      new RequestSearch({ includeSubordinates: "false" as unknown as boolean })
        .includeSubordinates
    ).toBe(false);
  });

  test('string "true" becomes true', () => {
    expect(
      new RequestSearch({ includeSubordinates: "true" as unknown as boolean })
        .includeSubordinates
    ).toBe(true);
  });

  test("omitted defaults to false", () => {
    expect(new RequestSearch({}).includeSubordinates).toBe(false);
  });
});
