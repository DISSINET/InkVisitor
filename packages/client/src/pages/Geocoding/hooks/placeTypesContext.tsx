import { IGeocodingPlaceType } from "@inkvisitor/shared/types/geocoding";
import React, { createContext, useContext } from "react";

/**
 * The project's location types, for every component that draws or offers one.
 *
 * A list row, a map card, the suggestion panel and the pickers all need the same
 * list and none of them is near where it is loaded, so it is provided once
 * rather than handed down through components that only pass it along.
 */

const PlaceTypesContext = createContext<IGeocodingPlaceType[]>([]);

/**
 * The labels of the Concepts a Location is only inferred to have a location type
 * through, by id: "inferred from city" needs the word, and the server answers
 * with the id.
 */
const ViaLabelsContext = createContext<Record<string, string>>({});

export const PlaceTypesProvider: React.FC<{
  placeTypes: IGeocodingPlaceType[];
  viaLabels?: Record<string, string>;
  children: React.ReactNode;
}> = ({ placeTypes, viaLabels = {}, children }) => (
  <PlaceTypesContext.Provider value={placeTypes}>
    <ViaLabelsContext.Provider value={viaLabels}>{children}</ViaLabelsContext.Provider>
  </PlaceTypesContext.Provider>
);

export const usePlaceTypes = (): IGeocodingPlaceType[] => useContext(PlaceTypesContext);

/** What to call the Concept a location type is inferred through, until its label is in. */
export const useViaLabel = (): ((conceptId: string) => string) => {
  const labels = useContext(ViaLabelsContext);
  return (conceptId) => labels[conceptId] || "another Concept";
};

/** The location type with this id in a list, for code that is not a component. */
export const findPlaceType = (
  all: IGeocodingPlaceType[],
  id: string | null | undefined,
): IGeocodingPlaceType | undefined => (id ? all.find((one) => one.id === id) : undefined);
