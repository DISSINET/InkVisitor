import { IcoLayers } from "Theme/icons";
import { BASEMAP_GROUPS } from "../../utils/map/basemapLayers";
import { DEFAULT_MAP_PREFS, MapLayerPrefs } from "../../utils/map/geocodingMapPrefs";
import React from "react";
import {
  StyledLayerCount,
  StyledLayerRow,
  StyledLayersHead,
  StyledLayersPanel,
  StyledLayersReset,
  StyledLayersToggle,
} from "./MapControlsStyles";

/**
 * The map's own controls, folded away behind one toggle.
 *
 * Everything behind it changes what is drawn and nothing else, so it is not a
 * setting the project shares — the researcher who wants only the place in
 * front of them is not making a decision anybody else has to live with.
 */
interface MapLayersPanel {
  open: boolean;
  onToggleOpen: () => void;
  layers: MapLayerPrefs;
  onChange: (next: MapLayerPrefs) => void;
  othersCount: number;
  suggestionsCount: number;
}

export const MapLayersPanel: React.FC<MapLayersPanel> = ({
  open,
  onToggleOpen,
  layers,
  onChange,
  othersCount,
  suggestionsCount,
}) => (
  <>
    <StyledLayersToggle
      type="button"
      $open={open}
      data-hint="display"
      aria-expanded={open}
      onClick={onToggleOpen}
    >
      <IcoLayers />
    </StyledLayersToggle>

    {open ? (
      <StyledLayersPanel role="group" aria-label="Map layers">
        <StyledLayersHead>display</StyledLayersHead>
        <StyledLayerRow>
          <input
            type="checkbox"
            checked={layers.others}
            onChange={(event) => onChange({ ...layers, others: event.target.checked })}
          />
          <span>
            other locations
            <StyledLayerCount>
              {othersCount} in the list{othersCount ? "" : " — the filters leave none"}
            </StyledLayerCount>
          </span>
        </StyledLayerRow>
        <StyledLayerRow>
          <input
            type="checkbox"
            checked={layers.suggestions}
            onChange={(event) => onChange({ ...layers, suggestions: event.target.checked })}
          />
          <span>
            suggestions
            <StyledLayerCount>
              {suggestionsCount ? `${suggestionsCount} being judged` : "none on screen"}
            </StyledLayerCount>
          </span>
        </StyledLayerRow>
        <StyledLayerRow>
          <input
            type="checkbox"
            checked={layers.names}
            onChange={(event) => onChange({ ...layers, names: event.target.checked })}
          />
          <span>
            names always shown
            <StyledLayerCount>rather than on hover</StyledLayerCount>
          </span>
        </StyledLayerRow>

        {/* the basemap's own drawing, as distinct from this page's marks */}
        <StyledLayersHead>basemap</StyledLayersHead>
        {BASEMAP_GROUPS.map((group) => (
          <StyledLayerRow key={group.id}>
            <input
              type="checkbox"
              checked={layers.basemap[group.id]}
              onChange={(event) =>
                onChange({
                  ...layers,
                  basemap: { ...layers.basemap, [group.id]: event.target.checked },
                })
              }
            />
            <span>
              {group.title}
              <StyledLayerCount>{group.note}</StyledLayerCount>
            </span>
          </StyledLayerRow>
        ))}
        <StyledLayersReset
          type="button"
          onClick={() => onChange(DEFAULT_MAP_PREFS)}
          disabled={JSON.stringify(layers) === JSON.stringify(DEFAULT_MAP_PREFS)}
        >
          reset to defaults
        </StyledLayersReset>
      </StyledLayersPanel>
    ) : null}
  </>
);
