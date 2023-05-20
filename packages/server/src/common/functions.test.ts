import "ts-jest";
import { sanitizeText } from "./functions";

describe("Test sanitizeText", function () {
  it("should replace nbsp char  normal whitespace", () => {
    const input = "sciens\xa0esse\xa0hereticum/am/\xa0os/as";
    const wanted = "sciens esse hereticum/am/ os/as";
    expect(sanitizeText(input)).toEqual(wanted);
  });
});
