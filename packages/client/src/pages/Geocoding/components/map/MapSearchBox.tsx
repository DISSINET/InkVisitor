import { EngineSearchHit } from "../../types/engine";
import { IcoGeomPoint, IcoSearch } from "Theme/icons";
import { Input } from "components";
import React from "react";
import {
  StyledMapSearch,
  StyledSearchHit,
  StyledSearchHitMeta,
  StyledSearchHits,
} from "./MapControlsStyles";
import { CoordinateHover } from "../coordinate/CoordinateTag";
import { GazetteerTag } from "../gazetteer/GazetteerTag";

/**
 * Moving the map by name: the field and the hits that drop out of it.
 *
 * A separate component rather than inline JSX because the search box is a
 * complete, self-contained control — a field, a debounced list, and one
 * action per row — and naming it lets the effects and the pickers around it
 * read as the rest of what the map does.
 */
interface MapSearchBox {
  term: string;
  onTermChange: (value: string) => void;
  hits: EngineSearchHit[];
  onPick: (hit: EngineSearchHit) => void;
}

export const MapSearchBox: React.FC<MapSearchBox> = ({ term, onTermChange, hits, onPick }) => (
  <StyledMapSearch>
    <Input
      value={term}
      onChangeFn={onTermChange}
      placeholder="find a place to move the map…"
      icon={<IcoSearch />}
      changeOnType
      width="full"
      clearable
    />
    {hits.length ? (
      <StyledSearchHits>
        {hits.map((hit) => (
          <StyledSearchHit
            key={`${hit.source}-${hit.sourceId}-${hit.lat}`}
            type="button"
            onClick={() => onPick(hit)}
          >
            {hit.label}
            <StyledSearchHitMeta>
              <CoordinateHover lat={hit.lat} lon={hit.lon}>
                <IcoGeomPoint />
              </CoordinateHover>{" "}
              <GazetteerTag source={hit.source} />
              {hit.type ? ` · ${hit.type}` : ""}
            </StyledSearchHitMeta>
          </StyledSearchHit>
        ))}
      </StyledSearchHits>
    ) : null}
  </StyledMapSearch>
);
