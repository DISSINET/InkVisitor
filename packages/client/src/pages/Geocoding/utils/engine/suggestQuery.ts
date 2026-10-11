import { IGeocodingContext } from "@inkvisitor/shared/types/geocoding";
import { SuggestRequest } from "../../types/engine";
import { ENGINE_LIMITS, withinListLimits } from "./engineLimits";
import {
  contextLanguages,
  contextValues,
  disabledSourcesToSend,
  listToSend,
  regionBoxToSend,
  regionToSend,
  weightsToSend,
} from "../context/geocodingContextFields";

/**
 * The `/suggest` request for one name under a context.
 *
 * Shared by the panel's run and by quick geocode and batch, so a name asked
 * from any of them is the same question. A drawn box and a named region are
 * mutually exclusive on the engine — both together is a 422 rather than a
 * merge — so `regionToSend` yields nothing whenever a box is in force.
 */
export const buildSuggestQuery = (name: string, context: IGeocodingContext): SuggestRequest => ({
  name,
  region: withinListLimits(regionToSend(context)),
  regionBbox: regionBoxToSend(context),
  period: withinListLimits(listToSend(contextValues(context, "period"))),
  language: withinListLimits(listToSend(contextLanguages(context))),
  place_type: withinListLimits(listToSend(contextValues(context, "placeType"))),
  contextWeights: weightsToSend(context),
  disabledSources: disabledSourcesToSend(context)?.slice(0, ENGINE_LIMITS.disabledSources),
  taskCategory: context.taskCategory,
  dedupeDiacritics: context.dedupeDiacritics,
});
