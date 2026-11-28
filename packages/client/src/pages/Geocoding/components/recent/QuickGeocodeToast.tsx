import React from "react";
import { CoordinateTag } from "../coordinate/CoordinateTag";
import { Suggestion } from "../../types/engine";
import { GazetteerTag } from "../gazetteer/GazetteerTag";
import { placeTypeInfo } from "../placeType/placeTypeIcons";
import {
  StyledQuickToast,
  StyledQuickToastAction,
  StyledQuickToastHead,
  StyledQuickToastLine,
  StyledQuickToastMeta,
} from "./QuickGeocodeToastStyles";
import { splitLabel } from "../../utils/suggestions/suggestionLabel";

/**
 * What a quick geocode wrote, said where the researcher is looking.
 *
 * A quick geocode is run from a list row and the answer is a coordinate on a
 * place the researcher has stopped watching, so the notice carries what was
 * decided and on what grounds — which place it matched, what gazetteer location type it is, how
 * many sources stood behind it — enough to tell a good answer from a lucky one
 * without opening the Location. The whole notice is the way to the map.
 */
interface QuickGeocodeToast {
  label: string;
  suggestion: Suggestion;
  accuracy: string;
  /** The gazetteers the written coordinate cites; absent, every source of the suggestion is named. */
  cited?: string[];
  onShow: () => void;
}

export const QuickGeocodeToast: React.FC<QuickGeocodeToast> = ({
  label,
  suggestion,
  accuracy,
  cited,
  onShow,
}) => {
  const named = cited ?? suggestion.sources;
  const { name, region } = splitLabel(suggestion.label);
  const kind = placeTypeInfo(suggestion.placeType);
  return (
    <StyledQuickToast>
      <StyledQuickToastHead>{label} geocoded</StyledQuickToastHead>
      <StyledQuickToastLine>
        <span>
          matched <strong>{name}</strong>
          {region ? ` — ${region}` : ""}
        </span>
      </StyledQuickToastLine>
      <StyledQuickToastMeta>
        <CoordinateTag lat={suggestion.lat} lon={suggestion.lon} accuracy={accuracy} /> {accuracy}
        {suggestion.placeType ? ` · ${kind.label} by the gazetteers` : ""}
        {named.length ? (
          <>
            {cited
              ? ` · ${named.length} gazetteer${named.length === 1 ? "" : "s"} cited: `
              : ` · ${named.length} source${named.length === 1 ? "" : "s"}: `}
            {named.slice(0, 4).map((source, index) => (
              <React.Fragment key={source}>
                {index ? ", " : ""}
                <GazetteerTag source={source} />
              </React.Fragment>
            ))}
            {named.length > 4 ? "…" : ""}
          </>
        ) : null}
      </StyledQuickToastMeta>
      <StyledQuickToastAction type="button" onClick={onShow}>
        show on the map
      </StyledQuickToastAction>
    </StyledQuickToast>
  );
};
