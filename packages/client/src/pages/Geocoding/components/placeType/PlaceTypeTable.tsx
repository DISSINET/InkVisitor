import {
  ENGINE_PLACE_TYPE_INFO,
  GEOCODING_PLACE_TYPES,
  GeocodingPlaceType,
  IGeocodingPlaceType,
} from "@inkvisitor/shared/types/geocoding";
import { Button, IconWithTooltip, Input } from "components";
import Dropdown from "components/advanced";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { IcoPlus, IcoStarFilled, IcoStarOutline, IcoTrash } from "Theme/icons";
import { v4 as uuidv4 } from "uuid";
import { PLACE_ICON_KEYS, placeIcon } from "./placeTypeIcons";
import { assignConcept, makeFavorite, pairEngineType } from "../../utils/write/placeTypeEdits";
import {
  StyledFavorite,
  StyledIconAnchor,
  StyledIconBackdrop,
  StyledIconButton,
  StyledIconChoice,
  StyledIconPanel,
  StyledKindActions,
  StyledKindCell,
  StyledKindCount,
  StyledKindHeadRight,
  StyledKindHeader,
  StyledKindRow,
  StyledKindScroll,
} from "./PlaceTypeTableStyles";
import { ButtonSize } from "types";

/**
 * The project's own kinds of place.
 *
 * Free to define: a name, the Concept a Location is classified under, a mark,
 * the engine type it answers to and a description. The engine type is what
 * connects a suggestion's own type to the project's vocabulary, and the star
 * marks the kind offered first where several answer to the same engine type.
 */

interface PlaceTypeTable {
  value: IGeocodingPlaceType[];
  onChange: (next: IGeocodingPlaceType[]) => void;
  /** The assigned Concept with its unlink, or the suggester that picks one. */
  renderConcept: (conceptId: string, set: (conceptId: string | null) => void) => React.ReactNode;
  /** Locations classified under each kind's Concept, by kind id. */
  counts: Record<string, number>;
  countsLoading: boolean;
  /** The counts could not be read, so they are not shown as zero. */
  countsFailed: boolean;
}

/** The icon grid is about this tall; it opens upward where there is no room below the button. */
const PANEL_HEIGHT = 230;

const NO_ENGINE_TYPE = "none";

const engineOptions = [
  { value: NO_ENGINE_TYPE, label: "no engine type" },
  ...GEOCODING_PLACE_TYPES.map((engineType) => ({
    value: engineType,
    label: ENGINE_PLACE_TYPE_INFO[engineType].label,
  })),
];

export const PlaceTypeTable: React.FC<PlaceTypeTable> = ({
  value,
  onChange,
  renderConcept,
  counts,
  countsLoading,
  countsFailed,
}) => {
  // the grid is drawn in the body at the button's own position: the table scrolls
  // sideways, which clips anything positioned inside it
  const [iconFor, setIconFor] = useState<{ id: string; top: number; left: number } | null>(null);

  const patch = (id: string, changes: Partial<IGeocodingPlaceType>) =>
    onChange(value.map((one) => (one.id === id ? { ...one, ...changes } : one)));

  const add = () =>
    onChange([
      ...value,
      {
        id: uuidv4(),
        name: "",
        description: "",
        icon: "star",
        conceptId: "",
        engineType: null,
        favorite: false,
      },
    ]);

  return (
    <StyledKindScroll>
      <StyledKindHeader>
        <span />
        <span>name</span>
        <span>Concept a Location is classified under</span>
        <span>engine type</span>
        <span />
        <StyledKindHeadRight>locations</StyledKindHeadRight>
        <span>description</span>
        <span />
      </StyledKindHeader>
      {value.map((kind) => {
        const Icon = placeIcon(kind.icon);
        return (
          <StyledKindRow key={kind.id}>
            <StyledIconAnchor>
              <StyledIconButton
                type="button"
                $open={iconFor?.id === kind.id}
                aria-label={`mark for ${kind.name || "this kind"}`}
                onClick={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  setIconFor(
                    iconFor?.id === kind.id
                      ? null
                      : {
                          id: kind.id,
                          top:
                            box.bottom + PANEL_HEIGHT > window.innerHeight
                              ? box.top - PANEL_HEIGHT
                              : box.bottom,
                          left: box.left,
                        }
                  );
                }}
              >
                <Icon />
              </StyledIconButton>
              {iconFor?.id === kind.id
                ? createPortal(
                    <>
                      <StyledIconBackdrop onClick={() => setIconFor(null)} />
                      <StyledIconPanel
                        role="listbox"
                        aria-label="Marks"
                        $top={iconFor.top}
                        $left={iconFor.left}
                      >
                        {PLACE_ICON_KEYS.map((key) => {
                          const Choice = placeIcon(key);
                          return (
                            <StyledIconChoice
                              key={key}
                              type="button"
                              role="option"
                              aria-selected={kind.icon === key}
                              aria-label={key}
                              $current={kind.icon === key}
                              onClick={() => {
                                patch(kind.id, { icon: key });
                                setIconFor(null);
                              }}
                            >
                              <Choice />
                            </StyledIconChoice>
                          );
                        })}
                      </StyledIconPanel>
                    </>,
                    document.body
                  )
                : null}
            </StyledIconAnchor>
            <Input
              value={kind.name}
              onChangeFn={(name) => patch(kind.id, { name })}
              placeholder="name"
              changeOnType
              width="full"
            />
            <StyledKindCell>
              {renderConcept(kind.conceptId, (conceptId) =>
                onChange(assignConcept(value, kind.id, conceptId))
              )}
            </StyledKindCell>
            <Dropdown.Single.Basic
              width="full"
              options={engineOptions}
              value={kind.engineType ?? NO_ENGINE_TYPE}
              onChange={(next) =>
                onChange(
                  pairEngineType(
                    value,
                    kind.id,
                    next === NO_ENGINE_TYPE ? null : (next as GeocodingPlaceType)
                  )
                )
              }
            />
            <StyledFavorite
              type="button"
              $on={kind.favorite}
              disabled={!kind.engineType}
              aria-label={
                kind.favorite
                  ? "favourite for its engine type"
                  : "make this the favourite for its engine type"
              }
              aria-pressed={kind.favorite}
              onClick={() => onChange(makeFavorite(value, kind.id))}
            >
              <IconWithTooltip
                icon={kind.favorite ? <IcoStarFilled /> : <IcoStarOutline />}
                tooltipText={
                  kind.engineType
                    ? "the favourite is the kind offered first when a suggestion has this engine type"
                    : "choose an engine type to make this a favourite"
                }
                tooltipPosition="top"
              />
            </StyledFavorite>
            <StyledKindCount>
              {!kind.conceptId
                ? "–"
                : countsFailed
                  ? "?"
                  : countsLoading
                    ? "…"
                    : (counts[kind.id] ?? 0)}
            </StyledKindCount>
            <Input
              value={kind.description}
              onChangeFn={(description) => patch(kind.id, { description })}
              placeholder="description"
              changeOnType
              width="full"
            />
            <Button
              icon={<IcoTrash />}
              color="danger"
              inverted
              tooltipLabel="remove this kind from the list — Classifications already made stay"
              onClick={() => onChange(value.filter((one) => one.id !== kind.id))}
              shape="square"
            />
          </StyledKindRow>
        );
      })}
      <StyledKindActions>
        <Button
          icon={<IcoPlus />}
          label="add a kind of place"
          color="primary"
          inverted
          onClick={add}
          size={ButtonSize.Medium}
        />
      </StyledKindActions>
    </StyledKindScroll>
  );
};
