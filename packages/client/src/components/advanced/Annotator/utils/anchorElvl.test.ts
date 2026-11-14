import { EntityEnums } from "@inkvisitor/shared/enums";
import { describe, expect, it } from "vitest";
import { isForeignLanguageEntity } from "./anchorElvl";

const { Class, Language } = EntityEnums;

describe("isForeignLanguageEntity", () => {
  const latinPerson = { class: Class.Person, language: Language.Latin };

  it("flags an entity in another language than the source", () => {
    expect(isForeignLanguageEntity(latinPerson, Language.English)).toBe(true);
  });

  it("keeps an entity in the source language", () => {
    expect(isForeignLanguageEntity(latinPerson, Language.Latin)).toBe(false);
  });

  it("flags an entity without a language", () => {
    const person = { class: Class.Person, language: Language.Empty };
    expect(isForeignLanguageEntity(person, Language.Latin)).toBe(true);
  });

  it("keeps every entity when the user has no source language", () => {
    expect(isForeignLanguageEntity(latinPerson, undefined)).toBe(false);
    expect(isForeignLanguageEntity(latinPerson, Language.Empty)).toBe(false);
  });

  it("skips statements and territories", () => {
    const statement = { class: Class.Statement, language: Language.English };
    const territory = { class: Class.Territory, language: Language.English };
    expect(isForeignLanguageEntity(statement, Language.Latin)).toBe(false);
    expect(isForeignLanguageEntity(territory, Language.Latin)).toBe(false);
  });
});
