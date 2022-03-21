import { Elvl, EntityReferenceSource } from "../enums";

export const entityReferenceSourceDict = [
  {
    value: EntityReferenceSource.WordNet,
    label: "WordNet",
    info: "",
    entityClasses: ["P", "L", "C", "A"],
  },
  {
    value: EntityReferenceSource.VIAF,
    label: "VIAF",
    info: "",
    entityClasses: ["P", "L", "C", "A"],
  },
  {
    value: EntityReferenceSource.GeoNames,
    label: "Geonames",
    info: "",
    entityClasses: ["L"],
  },
  {
    value: EntityReferenceSource.ISBN,
    label: "ISBN",
    info: "",
    entityClasses: ["R"],
  },
  {
    value: EntityReferenceSource.DOI,
    label: "DOI",
    info: "",
    entityClasses: ["R"],
  },
];
