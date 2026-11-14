import { EntityEnums } from "@inkvisitor/shared/enums";
import { describe, expect, it } from "vitest";
import { isAnchorLanguageMismatch } from "./anchorElvl";

const { Elvl, Class, Language } = EntityEnums;

describe("isAnchorLanguageMismatch", () => {
  const latinPerson = { class: Class.Person, language: Language.Latin };

  it("flags a textual anchor of an entity in another language than the source", () => {
    expect(isAnchorLanguageMismatch(Elvl.Textual, latinPerson, Language.English)).toBe(true);
  });

  it("keeps a textual anchor of an entity in the source language", () => {
    expect(isAnchorLanguageMismatch(Elvl.Textual, latinPerson, Language.Latin)).toBe(false);
  });

  it("keeps interpretive and inferential anchors and anchors without elvl", () => {
    expect(isAnchorLanguageMismatch(Elvl.Interpretive, latinPerson, Language.English)).toBe(false);
    expect(isAnchorLanguageMismatch(Elvl.Inferential, latinPerson, Language.English)).toBe(false);
    expect(isAnchorLanguageMismatch(undefined, latinPerson, Language.English)).toBe(false);
  });

  it("keeps the anchor when the user has no source language", () => {
    expect(isAnchorLanguageMismatch(Elvl.Textual, latinPerson, undefined)).toBe(false);
    expect(isAnchorLanguageMismatch(Elvl.Textual, latinPerson, Language.Empty)).toBe(false);
  });

  it("skips statement and territory anchors", () => {
    const statement = { class: Class.Statement, language: Language.English };
    const territory = { class: Class.Territory, language: Language.English };
    expect(isAnchorLanguageMismatch(Elvl.Textual, statement, Language.Latin)).toBe(false);
    expect(isAnchorLanguageMismatch(Elvl.Textual, territory, Language.Latin)).toBe(false);
  });
});
