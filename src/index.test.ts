import "jest";
import { sanitizeBigIntToString } from ".";

describe("test sanitize", () => {
  it("should transform bigint into string", () => {
    const numb = 123098453298791273498732421321;

    expect(
      sanitizeBigIntToString({
        asd: numb,
        hierarchy: { child: numb, normal: 123 },
        thing: ["asd"],
      })
    ).toEqual({
      asd: `${numb}`,
      hierarchy: { child: `${numb}`, normal: 123 },
      thing: ["asd"],
    });
  });

  it("should keep integer", () => {
    const numb = 5430935422543123;

    expect(sanitizeBigIntToString({ asd: numb })).toEqual({ asd: numb });
  });
});
