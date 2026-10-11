import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import React, { createContext, useContext, useMemo } from "react";

/**
 * The project's kinds of place, for every component that draws or offers one.
 *
 * A list row, a map card, the suggestion panel and the pickers all need the same
 * list and none of them is near where it is loaded, so it is provided once
 * rather than handed down through components that only pass it along.
 */

const PlaceTypesContext = createContext<IGeocodingPlaceType[]>([]);

export const PlaceTypesProvider: React.FC<{
  placeTypes: IGeocodingPlaceType[];
  children: React.ReactNode;
}> = ({ placeTypes, children }) => (
  <PlaceTypesContext.Provider value={placeTypes}>{children}</PlaceTypesContext.Provider>
);

export const usePlaceTypes = (): IGeocodingPlaceType[] => useContext(PlaceTypesContext);

/** The kind with this id, or undefined — a kind removed from the settings is simply not found. */
export const usePlaceType = (id: string | null | undefined): IGeocodingPlaceType | undefined => {
  const all = usePlaceTypes();
  return useMemo(() => (id ? all.find((one) => one.id === id) : undefined), [all, id]);
};

/** The kind with this id in a list, for code that is not a component. */
export const findPlaceType = (
  all: IGeocodingPlaceType[],
  id: string | null | undefined,
): IGeocodingPlaceType | undefined => (id ? all.find((one) => one.id === id) : undefined);
