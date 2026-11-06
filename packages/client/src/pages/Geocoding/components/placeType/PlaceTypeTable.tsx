import {
  ENGINE_PLACE_TYPE_INFO,
  GEOCODING_PLACE_TYPES,
  GeocodingPlaceType,
  IGeocodingPlaceType,
} from "@inkvisitor/shared/types/geocoding";
import { Button, IconWithTooltip, Input, Tooltip } from "components";
import Dropdown from "components/advanced";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { IcoInfo, IcoPlus, IcoStarFilled, IcoStarOutline, IcoTrash, IcoWarning } from "Theme/icons";
import { v4 as uuidv4 } from "uuid";
import { PLACE_ICON_KEYS, placeIcon } from "./placeTypeIcons";
import { assignConcept, makeFavorite, pairEngineType } from "../../utils/write/placeTypeEdits";
import {
  StyledFavorite,
  StyledHelpMark,
  StyledIconAnchor,
  StyledIconBackdrop,
  StyledIconButton,
  StyledIconChoice,
  StyledIconPanel,
  StyledKindActions,
  StyledKindCell,
  StyledEngineTypeHelp,
  StyledKindCount,
  StyledKindInferred,
  StyledKindHeadHelp,
  StyledKindHeadRight,
  StyledKindHeader,
  StyledKindRow,
  StyledKindScroll,
} from "./PlaceTypeTableStyles";
import { ButtonSize } from "types";

/**
 * The project's own location types.
 *
 * Free to define: a name, the Concept a Location is classified under, a mark,
 * the gazetteer location type it answers to and a description. The gazetteer location type is what
 * connects a suggestion's own type to the project's vocabulary, and the star
 * marks the location type offered first where several answer to the same gazetteer location type.
 */

interface PlaceTypeTable {
  value: IGeocodingPlaceType[];
  onChange: (next: IGeocodingPlaceType[]) => void;
  /** The assigned Concept with its unlink, or the suggester that picks one. */
  renderConcept: (conceptId: string, set: (conceptId: string | null) => void) => React.ReactNode;
  /** Locations classified under each location type's Concept, by location type id. */
  counts: Record<string, number>;
  /** How many of each count are Locations that come under a subclass or a synonym of the Concept. */
  inferredCounts?: Record<string, number>;
  /** The location types whose Concept has more subclasses than could be followed. */
  truncatedTypes?: string[];
  /** The location types whose count is not yet known, as against zero. */
  pendingTypes?: string[];
  countsLoading: boolean;
  /** The counts could not be read, so they are not shown as zero. */
  countsFailed: boolean;
}

/** The icon grid is about this tall; it opens upward where there is no room below the button. */
const PANEL_HEIGHT = 230;

const NO_ENGINE_TYPE = "none";

const engineOptions = [
  { value: NO_ENGINE_TYPE, label: "no gazetteer location type" },
  ...GEOCODING_PLACE_TYPES.map((engineType) => ({
    value: engineType,
    label: ENGINE_PLACE_TYPE_INFO[engineType].label,
  })),
];

/**
 * What each gazetteer location type covers, from the mark on the column title.
 *
 * A location type such as "church" is paired with one of twelve names that mean
 * more than they say, and "religious house" is the one that covers it. Opened by
 * hover or by focus, so it can be read from the keyboard.
 */
const EngineTypeHelp: React.FC = () => {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <StyledHelpMark
        type="button"
        ref={setAnchor}
        aria-label="what each gazetteer location type covers"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        <IcoInfo />
      </StyledHelpMark>
      <Tooltip
        visible={open}
        referenceElement={anchor}
        position="bottom"
        content={
          <StyledEngineTypeHelp>
            <p>The twelve types the gazetteers use. Choose the one that covers your location type:</p>
            <dl>
              {GEOCODING_PLACE_TYPES.map((engineType) => (
                <React.Fragment key={engineType}>
                  <dt>{ENGINE_PLACE_TYPE_INFO[engineType].label}</dt>
                  <dd>{ENGINE_PLACE_TYPE_INFO[engineType].description}</dd>
                </React.Fragment>
              ))}
            </dl>
          </StyledEngineTypeHelp>
        }
      />
    </>
  );
};

export const PlaceTypeTable: React.FC<PlaceTypeTable> = ({
  value,
  onChange,
  renderConcept,
  counts,
  inferredCounts = {},
  truncatedTypes = [],
  pendingTypes = [],
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
        <StyledKindHeadHelp>
          <span>gazetteer location type</span>
          <EngineTypeHelp />
        </StyledKindHeadHelp>
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
                aria-label={`mark for ${kind.name || "this location type"}`}
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
                  ? "favourite for its gazetteer location type"
                  : "make this the favourite for its gazetteer location type"
              }
              aria-pressed={kind.favorite}
              onClick={() => onChange(makeFavorite(value, kind.id))}
            >
              <IconWithTooltip
                icon={kind.favorite ? <IcoStarFilled /> : <IcoStarOutline />}
                tooltipText={
                  kind.engineType
                    ? "the favourite is the location type offered first when a suggestion has this gazetteer location type"
                    : "choose a gazetteer location type to make this a favourite"
                }
                tooltipPosition="top"
              />
            </StyledFavorite>
            <StyledKindCount>
              {!kind.conceptId
                ? "–"
                : countsFailed
                  ? "?"
                  : countsLoading || pendingTypes.includes(kind.id)
                    ? "…"
                    : (counts[kind.id] ?? 0)}
              {kind.conceptId &&
              !countsFailed &&
              !countsLoading &&
              !pendingTypes.includes(kind.id) &&
              inferredCounts[kind.id] ? (
                <IconWithTooltip
                  icon={<StyledKindInferred>+{inferredCounts[kind.id]}</StyledKindInferred>}
                  tooltipText={`${inferredCounts[kind.id]} of these are classified under a subclass or a synonym of this Concept, not under the Concept itself.`}
                  tooltipPosition="top"
                />
              ) : null}
              {truncatedTypes.includes(kind.id) ? (
                <IconWithTooltip
                  icon={<IcoWarning />}
                  color="warning"
                  tooltipText="This Concept has more subclasses than can be followed, so Locations classified deeper down are not counted and show no location type. Assign a narrower Concept."
                  tooltipPosition="top"
                />
              ) : null}
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
              tooltipLabel="remove this location type from the list — Classifications already made stay"
              onClick={() => onChange(value.filter((one) => one.id !== kind.id))}
              shape="square"
            />
          </StyledKindRow>
        );
      })}
      <StyledKindActions>
        <Button
          icon={<IcoPlus />}
          label="add a location type"
          color="primary"
          inverted
          onClick={add}
          size={ButtonSize.Medium}
        />
      </StyledKindActions>
    </StyledKindScroll>
  );
};
