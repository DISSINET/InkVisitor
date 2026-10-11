import {
  ENGINE_PLACE_TYPE_INFO,
  GEOCODING_PLACE_TYPES,
  GeocodingPlaceType,
  IGeocodingPlaceType,
} from "@inkvisitor/shared/types/geocoding";
import React from "react";
import {
  IcoPlaceArchaeological,
  IcoPlaceBattlefield,
  IcoPlaceBridge,
  IcoPlaceCastle,
  IcoPlaceCross,
  IcoPlaceFlag,
  IcoPlaceFortress,
  IcoPlaceForest,
  IcoPlaceFountain,
  IcoPlaceGrave,
  IcoPlaceHorse,
  IcoPlaceHospital,
  IcoPlaceHouse,
  IcoPlaceIsland,
  IcoPlaceLake,
  IcoPlaceLighthouse,
  IcoPlaceMine,
  IcoPlaceMonument,
  IcoPlaceMoon,
  IcoPlaceMountain,
  IcoPlacePort,
  IcoPlaceRegion,
  IcoPlaceReligious,
  IcoPlaceRiver,
  IcoPlaceRoad,
  IcoPlaceSchool,
  IcoPlaceSettlement,
  IcoPlaceShip,
  IcoPlaceStar,
  IcoPlaceTent,
  IcoPlaceTower,
  IcoPlaceUnknown,
  IcoPlaceWall,
  IcoPlaceWarehouse,
  IcoPlaceWheat,
} from "Theme/icons";

/**
 * One mark per kind of place, all from the same drawn set.
 *
 * A kind of place is read at a glance, in a list where every other row differs
 * only by its name — so the marks have to be distinguishable from each other at
 * one size, which is a property of the set rather than of any one icon.
 *
 * Two vocabularies use it. The engine's twelve types name what a suggestion is,
 * and the project's own kinds name what a Location is; a project kind carries
 * the key of the mark it wants.
 */

/** The marks a project can give a kind, by the key stored on it. */
export const PLACE_ICONS: Record<string, React.ComponentType> = {
  settlement: IcoPlaceSettlement,
  fortress: IcoPlaceFortress,
  religious: IcoPlaceReligious,
  region: IcoPlaceRegion,
  river: IcoPlaceRiver,
  lake: IcoPlaceLake,
  mountain: IcoPlaceMountain,
  island: IcoPlaceIsland,
  road: IcoPlaceRoad,
  archaeological: IcoPlaceArchaeological,
  battlefield: IcoPlaceBattlefield,
  port: IcoPlacePort,
  castle: IcoPlaceCastle,
  bridge: IcoPlaceBridge,
  monument: IcoPlaceMonument,
  tower: IcoPlaceTower,
  house: IcoPlaceHouse,
  warehouse: IcoPlaceWarehouse,
  school: IcoPlaceSchool,
  hospital: IcoPlaceHospital,
  forest: IcoPlaceForest,
  wall: IcoPlaceWall,
  tent: IcoPlaceTent,
  lighthouse: IcoPlaceLighthouse,
  ship: IcoPlaceShip,
  mine: IcoPlaceMine,
  cross: IcoPlaceCross,
  moon: IcoPlaceMoon,
  star: IcoPlaceStar,
  grave: IcoPlaceGrave,
  fountain: IcoPlaceFountain,
  wheat: IcoPlaceWheat,
  flag: IcoPlaceFlag,
  horse: IcoPlaceHorse,
};

export const PLACE_ICON_KEYS = Object.keys(PLACE_ICONS);

/** The mark for a key, or the unknown mark for one the set does not have. */
export const placeIcon = (key: string | null | undefined): React.ComponentType =>
  (key && PLACE_ICONS[key]) || IcoPlaceUnknown;

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

/** What an engine type is called and covers, or the unknown mark for anything else. */
export const placeTypeInfo = (placeType: string | null | undefined): PlaceTypeInfo => {
  const known = placeType && ENGINE_PLACE_TYPE_INFO[placeType as GeocodingPlaceType];
  return known
    ? { icon: placeIcon(known.icon), label: known.label, description: known.description }
    : UNKNOWN_PLACE_TYPE;
};

/**
 * The mark for an engine type. A type the engine has added since, or none at
 * all, draws the unknown mark rather than nothing — an absent icon reads as a
 * rendering fault, and "nobody has said" is a fact worth showing.
 */
export const PlaceTypeIcon: React.FC<{ placeType: string | null | undefined }> = ({
  placeType,
}) => {
  const Icon = placeTypeInfo(placeType).icon;
  return <Icon />;
};

/** The engine's types in the engine's order. */
export const ENGINE_TYPES: readonly GeocodingPlaceType[] = GEOCODING_PLACE_TYPES;

/** What a project's kind is called and covers; the unknown mark where it has none. */
export const kindInfo = (kind: IGeocodingPlaceType | null | undefined): PlaceTypeInfo =>
  kind
    ? { icon: placeIcon(kind.icon), label: kind.name, description: kind.description }
    : UNKNOWN_PLACE_TYPE;

/** The mark for a project's kind, or the unknown mark for none. */
export const KindIcon: React.FC<{ kind: IGeocodingPlaceType | null | undefined }> = ({ kind }) => {
  const Icon = kindInfo(kind).icon;
  return <Icon />;
};
