import { IGeocodingContext } from "@inkvisitor/shared/types/geocoding";
import { SuggestRequest } from "../../types/engine";
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
  region: regionToSend(context),
  regionBbox: regionBoxToSend(context),
  period: listToSend(contextValues(context, "period")),
  language: listToSend(contextLanguages(context)),
  place_type: listToSend(contextValues(context, "placeType")),
  contextWeights: weightsToSend(context),
  disabledSources: disabledSourcesToSend(context),
  taskCategory: context.taskCategory,
  dedupeDiacritics: context.dedupeDiacritics,
});
