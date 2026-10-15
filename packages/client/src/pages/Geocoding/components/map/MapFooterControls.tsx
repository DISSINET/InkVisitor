import { Button, Input } from "components";
import React from "react";
import { GeocodingLocation } from "../../hooks/useGeocodingLocations";
import { StyledManualEntry, StyledMapFooter, StyledMapHint } from "./MapControlsStyles";

/**
 * Naming the act of setting a coordinate and performing it without a mouse.
 *
 * The sentence naming the act and the fields that perform it are one strip:
 * clicking is a mouse gesture and the pair of fields is the same act without
 * one, so a reader who cannot click finds the alternative where the instruction
 * they cannot follow is written.
 */
interface MapFooterControls {
  selected: GeocodingLocation | undefined;
  manual: { lat: string; lon: string };
  onManualChange: React.Dispatch<React.SetStateAction<{ lat: string; lon: string }>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export const MapFooterControls: React.FC<MapFooterControls> = ({
  selected,
  manual,
  onManualChange,
  onSubmit,
}) => (
  <StyledMapFooter>
    <StyledMapHint>
      {selected
        ? `click the map to set a coordinate for ${selected.entity.labels[0]}, or`
        : "select a location to begin"}
    </StyledMapHint>
    {selected ? (
      <StyledManualEntry onSubmit={onSubmit}>
        <Input
          value={manual.lat}
          onChangeFn={(value) => onManualChange((m) => ({ ...m, lat: value }))}
          placeholder="latitude"
          changeOnType
          width={90}
        />
        <Input
          value={manual.lon}
          onChangeFn={(value) => onManualChange((m) => ({ ...m, lon: value }))}
          placeholder="longitude"
          changeOnType
          width={90}
        />
        <Button label="set" color="primary" onClick={() => undefined} />
      </StyledManualEntry>
    ) : null}
  </StyledMapFooter>
);
