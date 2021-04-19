import "ts-jest";
import { Prop } from "./prop";

describe("Prop constructor test", function () {
  describe("empty data", () => {
    const emptyData = {};
    const emptyProp: Prop = Object.create(Prop.prototype);
    emptyProp.id = "";
    emptyProp.elvl = "";
    emptyProp.certainty = "";
    emptyProp.modality = "";
    emptyProp.origin = "";
    emptyProp.type = {
      id: "",
      certainty: "",
      elvl: "",
    };
    emptyProp.value = {
      id: "",
      certainty: "",
      elvl: "",
    };

    it("should return empty prop", () => {
      const out = new Prop(emptyData);
      expect(out).toEqual(emptyProp);
    });
  });

  describe("ok data", () => {
    const fullData = {
      id: "",
      elvl: "elvl",
      certainty: "cert",
      modality: "modal",
      origin: "origin",
      type: {
        id: "typeid",
        certainty: "typecert",
        elvl: "typeelvl",
      },
      value: {
        id: "valueid",
        certainty: "valuecert",
        elvl: "valueelvl",
      },
    };
    const fullProp: Prop = Object.create(Prop.prototype);
    fullProp.id = "";
    fullProp.elvl = "elvl";
    fullProp.certainty = "cert";
    fullProp.modality = "modal";
    fullProp.origin = "origin";
    fullProp.type = {
      id: "typeid",
      certainty: "typecert",
      elvl: "typeelvl",
    };
    fullProp.value = {
      id: "valueid",
      certainty: "valuecert",
      elvl: "valueelvl",
    };

    it("should return full prop", () => {
      const out = new Prop(fullData);
      expect(out).toEqual(fullProp);
    });
  });
});

describe("Prop validate test", function () {
  describe("empty data", () => {
    it("should return true", () => {
      const emptyProp = new Prop(undefined);
      expect(emptyProp.isValid()).toEqual(true);
    });
  });
  describe("not empty data", () => {
    it("should return true", () => {
      const notEmpty = new Prop({
        id: "",
        elvl: "elvl",
        certainty: "cert",
        modality: "modal",
        origin: "origin",
        type: {
          id: "typeid",
          certainty: "typecert",
          elvl: "typeelvl",
        },
        value: {
          id: "valueid",
          certainty: "valuecert",
          elvl: "valueelvl",
        },
      });
      expect(notEmpty.isValid()).toEqual(true);
    });
  });
});
