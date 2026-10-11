import { useQuery } from "@tanstack/react-query";
import { engineSuggesters } from "./engine";
import type { EngineSuggester } from "./engineTypes";

/**
 * The engine's catalogue of sources, read once an hour and shared by every
 * component that names a gazetteer.
 *
 * One query key for all of them, so a page with fifty tags makes one request,
 * and the settings table and a hover card never disagree about a source.
 */
export const GAZETTEER_CATALOGUE_KEY = "geocoding-suggesters";

export const useGazetteerCatalogue = (): EngineSuggester[] | undefined =>
  useQuery({
    queryKey: [GAZETTEER_CATALOGUE_KEY],
    queryFn: ({ signal }) => engineSuggesters(signal),
    staleTime: 60 * 60 * 1000,
    retry: false,
  }).data;

/** What the engine says about one source, or undefined while unknown or unreachable. */
export const useGazetteer = (name: string): EngineSuggester | undefined =>
  useGazetteerCatalogue()?.find((one) => one.name === name);
