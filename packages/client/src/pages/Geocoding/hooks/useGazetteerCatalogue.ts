import { useQuery } from "@tanstack/react-query";
import { engineParameters, engineSuggesters } from "../utils/engine/engine";
import type { EngineParameters, EngineSuggester } from "../types/engine";

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

/**
 * The engine's vocabularies — regions, periods, languages, gazetteer location
 * types — read once an hour under one key, so the query panel and the settings
 * window cost one request between them.
 */
export const useEngineParameters = (): EngineParameters | undefined =>
  useQuery({
    queryKey: ["geocoding-parameters"],
    queryFn: ({ signal }) => engineParameters(signal),
    staleTime: 60 * 60 * 1000,
    retry: false,
  }).data;
