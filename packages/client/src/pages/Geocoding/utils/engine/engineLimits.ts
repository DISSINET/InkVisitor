import { SuggestRequest } from "../../types/engine";

/** What the engine refuses with HTTP 422 for being too large. */
export const ENGINE_LIMITS = {
  name: 200,
  listEntries: 10,
  listEntryLength: 100,
  providers: 8,
  disabledSources: 50,
} as const;

/**
 * A list as the engine accepts it: at most ten entries, none longer than a
 * hundred characters. The pickers stop at ten, so this only holds back a list
 * saved before the limit existed.
 */
export const withinListLimits = (values: string[] | undefined): string[] | undefined => {
  const kept = values
    ?.filter((value) => value.length <= ENGINE_LIMITS.listEntryLength)
    .slice(0, ENGINE_LIMITS.listEntries);
  return kept?.length ? kept : undefined;
};

/**
 * Why the engine would refuse this question for its size, in words for a
 * researcher, or null where it would not. The name is the one part that cannot
 * be cut down without changing what is asked, so it is refused here rather than
 * trimmed.
 */
export const tooLargeReason = (query: SuggestRequest): string | null =>
  query.name.length > ENGINE_LIMITS.name
    ? `The name is ${query.name.length} characters long and the engine accepts at most ${ENGINE_LIMITS.name}. Shorten it before geocoding.`
    : null;
