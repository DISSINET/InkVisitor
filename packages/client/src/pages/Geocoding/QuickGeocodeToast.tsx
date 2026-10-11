import React from "react";
import { CoordinateTag } from "./CoordinateTag";
import { Suggestion } from "./engineTypes";
import { PlaceTypeIcon, placeTypeInfo } from "./placeTypeIcons";
import {
  StyledQuickToast,
  StyledQuickToastAction,
  StyledQuickToastHead,
  StyledQuickToastLine,
  StyledQuickToastMeta,
} from "./QuickGeocodeToastStyles";
import { splitLabel } from "./suggestionLabel";

/**
 * What a quick geocode wrote, said where the researcher is looking.
 *
 * A quick geocode is run from a list row and the answer is a coordinate on a
 * place the researcher has stopped watching, so the notice carries what was
 * decided and on what grounds — which place it matched, what kind it is, how
 * many sources stood behind it — enough to tell a good answer from a lucky one
 * without opening the Location. The whole notice is the way to the map.
 */
interface QuickGeocodeToast {
  label: string;
  suggestion: Suggestion;
  accuracy: string;
  onShow: () => void;
}

export const QuickGeocodeToast: React.FC<QuickGeocodeToast> = ({
  label,
  suggestion,
  accuracy,
  onShow,
}) => {
  const { name, region } = splitLabel(suggestion.label);
  const kind = placeTypeInfo(suggestion.placeType);
  return (
    <StyledQuickToast>
      <StyledQuickToastHead>{label} geocoded</StyledQuickToastHead>
      <StyledQuickToastLine>
        {suggestion.placeType ? <PlaceTypeIcon placeType={suggestion.placeType} /> : null}
        <span>
          matched <strong>{name}</strong>
          {region ? ` — ${region}` : ""}
        </span>
      </StyledQuickToastLine>
      <StyledQuickToastMeta>
        <CoordinateTag lat={suggestion.lat} lon={suggestion.lon} accuracy={accuracy} /> {accuracy}
        {suggestion.placeType ? ` · ${kind.label}` : ""}
        {suggestion.sources.length
          ? ` · ${suggestion.sources.length} source${suggestion.sources.length === 1 ? "" : "s"}: ${suggestion.sources.slice(0, 4).join(", ")}${suggestion.sources.length > 4 ? "…" : ""}`
          : ""}
      </StyledQuickToastMeta>
      <StyledQuickToastAction type="button" onClick={onShow}>
        show on the map
      </StyledQuickToastAction>
    </StyledQuickToast>
  );
};
