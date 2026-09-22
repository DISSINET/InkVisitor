import {
  GEOCODING_SETTINGS_KEY,
  IGeocodingContext,
  IGeocodingContextWeights,
  IGeocodingRoles,
  IGeocodingSettings,
  defaultGeocodingContext,
  emptyGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";
import { useQuery } from "@tanstack/react-query";
import api from "api";
import { useUserQuery } from "hooks/react-query/useUserQuery";
import { useMemo } from "react";

/**
 * Resolves the Geocoding page's configuration.
 *
 * Roles come only from the project-wide settings row: which Concept means
 * `geo:x` decides what "geocoded" means, so one answer has to serve everyone.
 * Context layers — code default, then project, then the user's own — and layers
 * per field, so someone who has set only a region still inherits the rest.
 *
 * Stored under a single settings key rather than a settings group, because
 * `GET /settings/:key` is readable by every role while `GET /settings/group/:k`
 * is not, and the whole object is read and written together anyway.
 */

export interface ResolvedGeocodingConfig {
  roles: IGeocodingRoles;
  context: IGeocodingContext;
  /**
   * The same context without the researcher's own layer.
   *
   * What every field falls back to when a personal value is cleared, and what
   * the Suggestions panel names beside a field the researcher has overridden —
   * "your own value" only means something against the one it replaced.
   */
  projectContext: IGeocodingContext;
  /** False until an owner has assigned at least the two coordinate Concepts. */
  isConfigured: boolean;
  /** Role names still unassigned, for a message that says what is missing. */
  missingRoles: string[];
  isLoading: boolean;
}

/**
 * Whether a layer says anything about a field.
 *
 * An empty string, an empty list and null are all "not set" rather than "set to
 * nothing", so a half-filled user override never blanks the project default —
 * and clearing a field is what lets the project's answer through, which is the
 * behaviour every control on the panel is written against.
 */
const says = (value: unknown): boolean => {
  if (value === undefined || value === null || value === "") {
    return false;
  }
  return !(Array.isArray(value) && value.length === 0);
};

/** Later layers win per field, but only where they actually say something. */
export const layerGeocodingContext = <T extends object>(...layers: (T | undefined)[]): T =>
  layers.reduce<T>((acc, current) => {
    if (!current) {
      return acc;
    }
    const defined = Object.fromEntries(Object.entries(current).filter(([, value]) => says(value)));
    return { ...acc, ...defined };
  }, {} as T);

/**
 * The weights, layered a dimension at a time.
 *
 * The four dimensions are four independent answers that happen to be stored in
 * one object, so a researcher who has moved only `region` must still inherit
 * the project's `period` — which a whole-object override would take from them.
 */
const layerContextWeights = (
  ...layers: (IGeocodingContextWeights | undefined)[]
): IGeocodingContextWeights =>
  layers.reduce<IGeocodingContextWeights>((acc, current) => {
    if (!current) {
      return acc;
    }
    const defined = Object.fromEntries(
      Object.entries(current).filter(([, value]) => typeof value === "number"),
    );
    return { ...acc, ...defined };
  }, {});

/**
 * Every gazetteer either layer has switched off.
 *
 * A union, where every other list field replaces. The project's refusal is
 * about the corpus — a source that is not licensed for this work, or holds
 * nothing it is about — and a personal preference does not overrule that; the
 * researcher's is about their own runs. Replacing would let whichever layer
 * spoke last erase the other's refusal without saying so.
 */
export const unionSources = (...layers: (string[] | undefined)[]): string[] =>
  Array.from(new Set(layers.flatMap((layer) => layer ?? []))).sort();

export const useGeocodingConfig = (): ResolvedGeocodingConfig => {
  const { data: stored, isFetching: loadingSettings } = useQuery({
    queryKey: ["geocoding-settings"],
    queryFn: async () => {
      const response = await api.settingGet(GEOCODING_SETTINGS_KEY, {
        // a project that has never opened the global modal has no row, and the
        // page has a defined unconfigured state for exactly that
        ignoreErrorToast: true,
      });
      return (response.data?.data?.value as IGeocodingSettings | undefined) ?? undefined;
    },
    retry: false,
  });

  // the same cache entry the customization modal writes through, so a change
  // there reaches this without a second fetch
  const { data: user, isFetching: loadingUser } = useUserQuery();

  return useMemo(() => {
    const roles: IGeocodingRoles = {
      ...emptyGeocodingRoles(),
      ...(stored?.roles || {}),
    };

    const projectContext = layerGeocodingContext<IGeocodingContext>(
      defaultGeocodingContext(),
      stored?.context,
    );

    const personal = user?.options?.geocoding?.context;
    const context: IGeocodingContext = {
      ...layerGeocodingContext<IGeocodingContext>(projectContext, personal),
      contextWeights: layerContextWeights(projectContext.contextWeights, personal?.contextWeights),
      disabledSources: unionSources(projectContext.disabledSources, personal?.disabledSources),
    };

    const missingRoles = [
      !roles.x && "longitude Concept",
      !roles.y && "latitude Concept",
      !roles.accuracy && "accuracy Concept",
      !roles.type && "place type Concept",
    ].filter((entry): entry is string => !!entry);

    return {
      roles,
      context,
      projectContext,
      // the two coordinate Concepts are what a write and the geocoded/ungeocoded
      // distinction both need; the other two only limit what a write may carry
      isConfigured: !!roles.x && !!roles.y,
      missingRoles,
      isLoading: loadingSettings || loadingUser,
    };
  }, [stored, user, loadingSettings, loadingUser]);
};
