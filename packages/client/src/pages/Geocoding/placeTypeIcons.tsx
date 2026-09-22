import { GEOCODING_PLACE_TYPES, GeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import React from "react";
import {
  IcoPlaceArchaeological,
  IcoPlaceBattlefield,
  IcoPlaceFortress,
  IcoPlaceIsland,
  IcoPlaceLake,
  IcoPlaceMountain,
  IcoPlacePort,
  IcoPlaceRegion,
  IcoPlaceReligious,
  IcoPlaceRiver,
  IcoPlaceRoad,
  IcoPlaceSettlement,
  IcoPlaceUnknown,
} from "Theme/icons";

/**
 * One mark per kind of place, all from the same drawn set, each with the words
 * that say what it covers.
 *
 * A kind of place is read at a glance, in a list where every other row differs
 * only by its name — so the marks have to be distinguishable from each other at
 * one size, which is a property of the set rather than of any one icon. The
 * description exists because the twelve are the engine's vocabulary rather than
 * ordinary English: "religious" covers a chapel and a monastery, and nobody
 * guesses that from the word.
 */

export interface PlaceTypeInfo {
  icon: React.ComponentType;
  label: string;
  description: string;
}

/** The value used where a Location states no kind of place. */
export const NO_PLACE_TYPE_VALUE = "";

export const UNKNOWN_PLACE_TYPE: PlaceTypeInfo = {
  icon: IcoPlaceUnknown,
  label: "kind not recorded",
  description: "Nothing on this Location says what kind of place it is.",
};

const INFO: Record<GeocodingPlaceType, PlaceTypeInfo> = {
  settlement: {
    icon: IcoPlaceSettlement,
    label: "settlement",
    description: "Somewhere people lived: a city, town, village or hamlet.",
  },
  fortress: {
    icon: IcoPlaceFortress,
    label: "fortress",
    description: "A castle, fort or fortified seat, walled and held rather than farmed.",
  },
  religious: {
    icon: IcoPlaceReligious,
    label: "religious house",
    description: "A church, chapel, monastery, abbey or other religious foundation.",
  },
  region: {
    icon: IcoPlaceRegion,
    label: "region",
    description: "An area rather than a point: a province, duchy, diocese or district.",
  },
  river: {
    icon: IcoPlaceRiver,
    label: "river",
    description: "A river or stream. Its coordinate stands for a course, not a spot.",
  },
  lake: {
    icon: IcoPlaceLake,
    label: "lake",
    description: "A lake, pond or other standing water.",
  },
  mountain: {
    icon: IcoPlaceMountain,
    label: "mountain",
    description: "A peak, hill or range.",
  },
  island: {
    icon: IcoPlaceIsland,
    label: "island",
    description: "An island or group of them.",
  },
  road: {
    icon: IcoPlaceRoad,
    label: "road",
    description: "A road, route or pass, whose coordinate stands for a line.",
  },
  archaeological: {
    icon: IcoPlaceArchaeological,
    label: "archaeological site",
    description: "Remains rather than a settlement in use: ruins, a dig, an abandoned site.",
  },
  battlefield: {
    icon: IcoPlaceBattlefield,
    label: "battlefield",
    description: "Where a battle or siege happened, named for the event rather than the place.",
  },
  port: {
    icon: IcoPlacePort,
    label: "port",
    description: "A harbour, quay or landing place.",
  },
};

/** What a kind of place is called and covers, or the unknown mark for anything else. */
export const placeTypeInfo = (placeType: string | null | undefined): PlaceTypeInfo =>
  (placeType && INFO[placeType as GeocodingPlaceType]) || UNKNOWN_PLACE_TYPE;

/**
 * The mark for a kind of place. A kind the engine has added since, or none at
 * all, draws the unknown mark rather than nothing — an absent icon reads as a
 * rendering fault, and "nobody has said" is a fact worth showing.
 */
export const PlaceTypeIcon: React.FC<{ placeType: string | null | undefined }> = ({
  placeType,
}) => {
  const Icon = placeTypeInfo(placeType).icon;
  return <Icon />;
};

/** Every kind in the vocabulary's order, for a control that offers all of them. */
export const placeTypeChoices = (): { value: string; info: PlaceTypeInfo }[] =>
  GEOCODING_PLACE_TYPES.map((placeType) => ({ value: placeType, info: INFO[placeType] }));
