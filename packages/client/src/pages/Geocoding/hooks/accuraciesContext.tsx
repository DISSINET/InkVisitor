import { IResponseEntity } from "@inkvisitor/shared/types";
import { GeocodingAccuracy, IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import { useEntitiesQuery } from "hooks/react-query/useEntitiesQuery";
import React, { createContext, useContext, useMemo } from "react";

/**
 * The project's accuracies as the page shows them.
 *
 * An accuracy is a Concept the owner listed in the global settings; the page
 * offers them in that order, each as the Concept's tag, and calls each by the
 * Concept's label. Read once for the page and handed to
 * what draws or offers one, through this context where it sits under the page
 * and as a value where it does not (a hook of the page itself, a toast).
 */

/** One of the project's accuracies. */
export interface AccuracyEntry {
  conceptId: GeocodingAccuracy;
  /** The Concept, for its tag; absent while it loads, or where it was deleted. */
  entity?: IResponseEntity;
  label: string;
  detail: string;
}

export interface Accuracies {
  /** The listed accuracies with a Concept, in the order the owner listed them. */
  entries: AccuracyEntry[];
  /** The accuracy marked for a suggestion whose sources agree, or "". */
  whenAgree: GeocodingAccuracy;
  /** The accuracy marked for a suggestion whose sources are scattered, or "". */
  whenScattered: GeocodingAccuracy;
  /**
   * The Concept an accuracy is recorded under on a coordinate, the one assigned
   * for localisation accuracy; absent while it loads or where none is assigned.
   */
  roleConcept?: IResponseEntity;
  /**
   * What an accuracy is called; empty for none, and a plain description for a
   * Concept not listed, or listed but not read (deleted, or still loading).
   */
  labelOf: (accuracy: GeocodingAccuracy | null | undefined) => string;
}

const NONE: Accuracies = {
  entries: [],
  whenAgree: "",
  whenScattered: "",
  labelOf: (accuracy) => accuracy ?? "",
};

/** The query key the listed Concepts are cached under, for refreshing them after the settings are saved. */
export const ACCURACY_CONCEPTS_KEY = "geocoding-accuracy-concepts";

/** Reads the listed Concepts and puts the accuracies together; for the page that provides them. */
export const useAccuracyList = (
  roles: Pick<
    IGeocodingRoles,
    "accuracy" | "accuracies" | "accuracyWhenAgree" | "accuracyWhenScattered"
  >,
): Accuracies => {
  const ids = useMemo(() => roles.accuracies.filter(Boolean), [roles.accuracies]);
  // the role's Concept is read with the list, for the pickers' heading
  const fetched = useMemo(
    () => (roles.accuracy && !ids.includes(roles.accuracy) ? [...ids, roles.accuracy] : ids),
    [ids, roles.accuracy],
  );
  const { data } = useEntitiesQuery(ACCURACY_CONCEPTS_KEY, fetched, {
    keepPrevious: true,
    staleTime: 60_000,
  });
  const { accuracy, accuracies, accuracyWhenAgree, accuracyWhenScattered } = roles;
  return useMemo(
    () =>
      accuraciesOf(
        { accuracy, accuracies, accuracyWhenAgree, accuracyWhenScattered },
        data ?? [],
      ),
    [data, accuracy, accuracies, accuracyWhenAgree, accuracyWhenScattered],
  );
};

/** The accuracies out of the settings and the Concepts read for them. */
export const accuraciesOf = (
  roles: Pick<
    IGeocodingRoles,
    "accuracy" | "accuracies" | "accuracyWhenAgree" | "accuracyWhenScattered"
  >,
  concepts: IResponseEntity[],
): Accuracies => {
  const byId = new Map(concepts.map((entity) => [entity.id, entity]));
  const entries = roles.accuracies.filter(Boolean).map((conceptId) => {
    const entity = byId.get(conceptId);
    return {
      conceptId,
      entity,
      label: entity?.labels?.[0] ?? "",
      detail: entity?.detail ?? "",
    };
  });
  const labels = new Map(entries.map((entry) => [entry.conceptId, entry.label]));
  return {
    entries,
    whenAgree: roles.accuracyWhenAgree,
    whenScattered: roles.accuracyWhenScattered,
    roleConcept: roles.accuracy ? byId.get(roles.accuracy) : undefined,
    labelOf: (accuracy) =>
      !accuracy
        ? ""
        : !labels.has(accuracy)
          ? "an accuracy not in the project's list"
          : labels.get(accuracy) || "an accuracy whose Concept cannot be read",
  };
};

const AccuraciesContext = createContext<Accuracies>(NONE);

export const AccuraciesProvider: React.FC<{ value: Accuracies; children: React.ReactNode }> = ({
  value,
  children,
}) => <AccuraciesContext.Provider value={value}>{children}</AccuraciesContext.Provider>;

export const useAccuracies = (): Accuracies => useContext(AccuraciesContext);
