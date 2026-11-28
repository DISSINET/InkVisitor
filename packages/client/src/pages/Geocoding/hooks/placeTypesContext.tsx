import { IResponseEntity } from "@inkvisitor/shared/types";
import React, { createContext, useContext } from "react";
import { PlaceTypeNode } from "../utils/context/placeTypeHierarchy";

/**
 * The project's location types, for every component that draws or offers one.
 *
 * A list row, a map card, the suggestion panel and the pickers all need the same
 * list and none of them is near where it is loaded, so it is provided once
 * rather than handed down through components that only pass it along. The list
 * holds every location type with its subclass tree.
 */

const PlaceTypesContext = createContext<PlaceTypeNode[]>([]);

/** The Concepts of the location types by id, for the pickers that show each one's tag. */
const PlaceTypeConceptsContext = createContext<Record<string, IResponseEntity>>({});

/**
 * The labels of the Concepts a Location is only inferred to have a location type
 * through, by id: "inferred from city" needs the word, and the server answers
 * with the id.
 */
const ViaLabelsContext = createContext<Record<string, string>>({});

export const PlaceTypesProvider: React.FC<{
  placeTypes: PlaceTypeNode[];
  concepts?: Record<string, IResponseEntity>;
  viaLabels?: Record<string, string>;
  children: React.ReactNode;
}> = ({ placeTypes, concepts = {}, viaLabels = {}, children }) => (
  <PlaceTypesContext.Provider value={placeTypes}>
    <PlaceTypeConceptsContext.Provider value={concepts}>
      <ViaLabelsContext.Provider value={viaLabels}>{children}</ViaLabelsContext.Provider>
    </PlaceTypeConceptsContext.Provider>
  </PlaceTypesContext.Provider>
);

export const usePlaceTypes = (): PlaceTypeNode[] => useContext(PlaceTypesContext);

export const usePlaceTypeConcepts = (): Record<string, IResponseEntity> =>
  useContext(PlaceTypeConceptsContext);

/** What to call the Concept a location type is inferred through, until its label is in. */
export const useViaLabel = (): ((conceptId: string) => string) => {
  const labels = useContext(ViaLabelsContext);
  return (conceptId) => labels[conceptId] || "another Concept";
};

/** The location type with this id in a list, for code that is not a component. */
export const findPlaceType = <T extends { id: string }>(
  all: T[],
  id: string | null | undefined
): T | undefined => (id ? all.find((one) => one.id === id) : undefined);
