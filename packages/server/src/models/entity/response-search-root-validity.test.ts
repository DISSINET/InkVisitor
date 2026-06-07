import "ts-jest";
import { IRequestSearchRootValidity } from "@inkvisitor/shared/types/request-search";
import { ResponseSearch } from "./response-search";

describe("ResponseSearch.passesRootValidity", () => {
  it("Valid keeps entities with no warnings", () => {
    expect(ResponseSearch.passesRootValidity(false, IRequestSearchRootValidity.Valid)).toBe(true);
    expect(ResponseSearch.passesRootValidity(true, IRequestSearchRootValidity.Valid)).toBe(false);
  });

  it("Invalid keeps entities with warnings", () => {
    expect(ResponseSearch.passesRootValidity(true, IRequestSearchRootValidity.Invalid)).toBe(true);
    expect(ResponseSearch.passesRootValidity(false, IRequestSearchRootValidity.Invalid)).toBe(false);
  });

  it("Any keeps everything", () => {
    expect(ResponseSearch.passesRootValidity(true, IRequestSearchRootValidity.Any)).toBe(true);
    expect(ResponseSearch.passesRootValidity(false, IRequestSearchRootValidity.Any)).toBe(true);
  });
});
