import { Elvl, EntityReferenceSource } from "../enums";

export const entityReferenceSourceDict = [
  {
    value: EntityReferenceSource.GeoNames,
    label: "Geonames",
    info: "",
    entityClasses: ["L"],
  },
  {
    value: EntityReferenceSource.WordNet,
    label: "WordNet",
    info: "",
    entityClasses: ["P", "L", "C", "A"],
  },
];
