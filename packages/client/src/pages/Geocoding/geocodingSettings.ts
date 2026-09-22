import {
  GEOCODING_SETTINGS_KEY,
  IGeocodingRoles,
  IGeocodingSettings,
  emptyGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";
import api from "api";

/**
 * Writing the project-wide geocoding settings.
 *
 * One row under one key, read and written whole. Two screens write to it — the
 * settings modal, and the suggestion flow when it offers to create a Concept for
 * a place type nothing is mapped to — so the read-modify-write lives here rather
 * than in either of them.
 *
 * `PUT /settings/:key` is gated to admin and owner by the seeded permission row,
 * so a researcher who reaches this call is refused by the server rather than by
 * the button being hidden.
 */

const readSettings = async (): Promise<IGeocodingSettings> => {
  try {
    const response = await api.settingGet(GEOCODING_SETTINGS_KEY, { ignoreErrorToast: true });
    const stored = response.data?.data?.value as IGeocodingSettings | undefined;
    return {
      roles: { ...emptyGeocodingRoles(), ...(stored?.roles || {}) },
      context: stored?.context || {},
    };
  } catch {
    // no row yet: a project that has never opened the settings modal
    return { roles: emptyGeocodingRoles(), context: {} };
  }
};

/**
 * Assigns some roles without disturbing the rest.
 *
 * Assignment replaces: a role holds one entity id, never a list, so two Concepts
 * can never both be live as `geo:x`. The nested maps merge by key so assigning
 * one place type leaves the other eleven alone.
 */
export const patchGeocodingRoles = async (partial: Partial<IGeocodingRoles>): Promise<void> => {
  const current = await readSettings();
  const roles: IGeocodingRoles = {
    ...current.roles,
    ...partial,
    accuracyValues: { ...current.roles.accuracyValues, ...(partial.accuracyValues || {}) },
    placeTypes: { ...current.roles.placeTypes, ...(partial.placeTypes || {}) },
    resources: { ...current.roles.resources, ...(partial.resources || {}) },
  };
  await api.settingUpdate(GEOCODING_SETTINGS_KEY, { value: { ...current, roles } });
};

/**
 * A role held in one of the keyed maps, set or cleared.
 *
 * Clearing removes the key rather than storing an empty string: every reader
 * asks whether the key is there, and a key present with nothing behind it
 * answers yes.
 */
export const withEntry = <T extends Record<string, string | undefined>, K extends keyof T>(
  map: T,
  key: K,
  entityId: string | null,
): T => {
  const next = { ...map };
  if (entityId) {
    next[key] = entityId as T[K];
  } else {
    delete next[key];
  }
  return next;
};

/**
 * The base URL a gazetteer row carries as the Resource behind it changes.
 *
 * The URL is saved onto the Resource entity, so it belongs to whichever entity
 * the row points at rather than to the row: unlinking drops it, and attaching
 * one seeds the source's published default rather than inheriting whatever the
 * entity before it had. A source with no entry here is one the save leaves
 * alone, which is how the five gazetteers that publish no record URL stay blank.
 */
export const nextBaseUrls = (
  current: Record<string, string>,
  source: string,
  entityId: string | null,
  known: string | undefined,
): Record<string, string> => {
  const next = { ...current };
  if (!entityId) {
    delete next[source];
    return next;
  }
  if (known !== undefined && next[source] === undefined) {
    next[source] = known;
  }
  return next;
};

/**
 * Writes every role at once.
 *
 * The nested maps replace rather than merge, which is the whole difference from
 * patchGeocodingRoles: a caller holding all of the roles expresses "this place
 * type points at nothing" by leaving the key out, and a merge would read that
 * as "no opinion" and keep whatever is stored.
 */
export const putGeocodingRoles = async (roles: IGeocodingRoles): Promise<void> => {
  const current = await readSettings();
  await api.settingUpdate(GEOCODING_SETTINGS_KEY, { value: { ...current, roles } });
};

/** The project-wide default query context. Personal overrides live on the user. */
export const patchGeocodingContext = async (
  partial: IGeocodingSettings["context"],
): Promise<void> => {
  const current = await readSettings();
  await api.settingUpdate(GEOCODING_SETTINGS_KEY, {
    value: { ...current, context: { ...current.context, ...partial } },
  });
};
