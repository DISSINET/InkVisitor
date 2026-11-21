import {
  ENGINE_PLACE_TYPE_INFO,
  GEOCODING_PLACE_TYPES,
  GeocodingPlaceType,
  IGeocodingPlaceType,
} from "@inkvisitor/shared/types/geocoding";
import { IEntity } from "@inkvisitor/shared/types";
import { Button, Checkbox, IconWithTooltip, Input, Tooltip } from "components";
import Dropdown, { EntityTag } from "components/advanced";
import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  IcoChevronRight,
  IcoInfo,
  IcoPlus,
  IcoStarFilled,
  IcoStarOutline,
  IcoTrash,
  IcoWarning,
} from "Theme/icons";
import { PlaceTypeNode, childrenOf } from "../../utils/context/placeTypeHierarchy";
import { v4 as uuidv4 } from "uuid";
import { PLACE_ICON_KEYS, placeIcon } from "./placeTypeIcons";
import { assignConcept, makeFavorite, pairEngineType } from "../../utils/write/placeTypeEdits";
import {
  StyledFavorite,
  StyledFoldSpacer,
  StyledFoldToggle,
  StyledHelpMark,
  StyledIconAnchor,
  StyledIconBackdrop,
  StyledIconButton,
  StyledIconChoice,
  StyledIconPanel,
  StyledInheritedMark,
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
  StyledKindToolbar,
  StyledTreeCell,
} from "./PlaceTypeTableStyles";
import { ButtonSize } from "types";

/**
 * The project's own location types, each with the subclass tree of its Concept.
 *
 * Free to define on a location type: a name, the Concept a Location is
 * classified under, a mark, and the gazetteer type it answers to. The gazetteer
 * type is what connects a suggestion's own type to the project's vocabulary, and
 * the star marks the location type offered first where several answer to the
 * same gazetteer type. Every subclass of the Concept, at every depth, is a
 * location type of its own that shares the mark and the gazetteer type of the
 * one at its root; any row can be deactivated, which keeps it out of the
 * pickers. The description is the Concept's own detail.
 */

interface PlaceTypeTable {
  value: IGeocodingPlaceType[];
  onChange: (next: IGeocodingPlaceType[]) => void;
  /** Every location type of `value` with its subclass tree. */
  nodes: PlaceTypeNode[];
  /** The Concepts of the trees by id, for the tag of each subclass. */
  concepts: Record<string, IEntity>;
  /** A Concept's detail as the table shows it: what was typed here, or what the Concept holds. */
  detailOf: (conceptId: string) => string;
  onDetailChange: (conceptId: string, detail: string) => void;
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
  { value: NO_ENGINE_TYPE, label: "no gazetteer type" },
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
        aria-label="what each gazetteer type covers"
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
  nodes,
  concepts,
  detailOf,
  onDetailChange,
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
  // folded rows, by their place in the tree: a Concept with two superclasses is
  // shown under each, and each place folds on its own
  const [folded, setFolded] = useState<Set<string>>(new Set());
  const [showInactive, setShowInactive] = useState(true);

  const below = useMemo(() => childrenOf(nodes), [nodes]);
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const patch = (id: string, changes: Partial<IGeocodingPlaceType>) =>
    onChange(value.map((one) => (one.id === id ? { ...one, ...changes } : one)));

  const setActive = (rootId: string, conceptId: string, active: boolean) =>
    onChange(
      value.map((one) =>
        one.id !== rootId
          ? one
          : {
              ...one,
              inactive: active
                ? one.inactive.filter((id) => id !== conceptId)
                : [...one.inactive.filter((id) => id !== conceptId), conceptId],
            }
      )
    );

  const toggleFold = (path: string) =>
    setFolded((current) => {
      const next = new Set(current);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });

  const add = () =>
    onChange([
      ...value,
      {
        id: uuidv4(),
        name: "",
        icon: "star",
        conceptId: "",
        engineType: null,
        favorite: false,
        inactive: [],
      },
    ]);

  const count = (node: PlaceTypeNode, kind: IGeocodingPlaceType) => (
    <StyledKindCount>
      {!node.conceptId
        ? "–"
        : countsFailed
          ? "?"
          : countsLoading || pendingTypes.includes(kind.id)
            ? "…"
            : (counts[node.id] ?? 0)}
      {node.conceptId &&
      !countsFailed &&
      !countsLoading &&
      !pendingTypes.includes(kind.id) &&
      inferredCounts[node.id] ? (
        <IconWithTooltip
          icon={<StyledKindInferred>+{inferredCounts[node.id]}</StyledKindInferred>}
          tooltipText={`${inferredCounts[node.id]} of these are classified under a subclass or a synonym of this Concept, not under the Concept itself.`}
          tooltipPosition="top"
        />
      ) : null}
      {node.id === kind.id && truncatedTypes.includes(kind.id) ? (
        <IconWithTooltip
          icon={<IcoWarning />}
          color="warning"
          tooltipText="This Concept has more subclasses than can be followed, so the deepest are not listed, Locations classified under them are not counted and they show no location type. Assign a narrower Concept."
          tooltipPosition="top"
        />
      ) : null}
    </StyledKindCount>
  );

  /** The fold toggle, the tick, then whatever names the Concept. */
  const treeCell = (
    node: PlaceTypeNode,
    path: string,
    depth: number,
    open: boolean,
    hasChildren: boolean,
    name: React.ReactNode
  ) => (
    <StyledTreeCell $depth={depth}>
      {hasChildren ? (
        <StyledFoldToggle
          type="button"
          $open={open}
          aria-expanded={open}
          aria-label={
            open ? `fold the subclasses of ${node.name}` : `show the subclasses of ${node.name}`
          }
          onClick={() => toggleFold(path)}
        >
          <IcoChevronRight />
        </StyledFoldToggle>
      ) : (
        <StyledFoldSpacer />
      )}
      {node.conceptId ? (
        <Checkbox
          value={node.active}
          onChangeFn={(active) => setActive(node.rootId, node.conceptId, active)}
          tooltipLabel={
            node.active
              ? "offered when a location type is assigned; untick to stop offering it"
              : "not offered when a location type is assigned; Locations already classified under it keep it"
          }
        />
      ) : null}
      {name}
    </StyledTreeCell>
  );

  const description = (node: PlaceTypeNode) => (
    <Input
      type="textarea"
      rows={1}
      value={node.conceptId ? detailOf(node.conceptId) : ""}
      onChangeFn={(detail) => onDetailChange(node.conceptId, detail)}
      placeholder={node.conceptId ? "the Concept's detail" : "assign a Concept first"}
      disabled={!node.conceptId}
      changeOnType
      width="full"
    />
  );

  /** A subclass row and, unless folded, the rows below it. */
  const subclassRows = (
    kind: IGeocodingPlaceType,
    node: PlaceTypeNode,
    path: string,
    depth: number,
    trail: Set<string>
  ): React.ReactNode[] => {
    const children = (below.get(node.id) ?? []).filter((child) => !trail.has(child.id));
    const open = !folded.has(path);
    const Icon = placeIcon(kind.icon);
    const concept = concepts[node.conceptId];
    const rows: React.ReactNode[] = [];
    if (showInactive || node.active) {
      rows.push(
        <StyledKindRow key={path} $inactive={!node.active}>
          <StyledInheritedMark aria-hidden>
            <Icon />
          </StyledInheritedMark>
          <span />
          {treeCell(
            node,
            path,
            depth,
            open,
            children.length > 0,
            concept ? (
              <EntityTag
                entity={concept}
                fullWidth
                disableTooltip
                disableDrag
                disableCopyToClipboard
              />
            ) : (
              <span>{node.name || "…"}</span>
            )
          )}
          <span />
          <span />
          {count(node, kind)}
          {description(node)}
          <span />
        </StyledKindRow>
      );
    }
    if (open) {
      const deeper = new Set(trail).add(node.id);
      for (const child of children) {
        rows.push(...subclassRows(kind, child, `${path}/${child.conceptId}`, depth + 1, deeper));
      }
    }
    return rows;
  };

  return (
    <StyledKindScroll>
      <StyledKindToolbar>
        <Checkbox
          value={showInactive}
          onChangeFn={setShowInactive}
          label="show deactivated Concepts"
        />
      </StyledKindToolbar>
      <StyledKindHeader>
        <span />
        <span>name</span>
        <span>Concept a Location is classified under</span>
        <StyledKindHeadHelp>
          <span>gazetteer type</span>
          <EngineTypeHelp />
        </StyledKindHeadHelp>
        <span />
        <StyledKindHeadRight>locations</StyledKindHeadRight>
        <span>description</span>
        <span />
      </StyledKindHeader>
      {value.map((kind) => {
        const Icon = placeIcon(kind.icon);
        // the row as edited here: until the tree of a Concept just picked is in, the
        // tree on hand is the old Concept's, and a tick or a text must not reach it
        const node: PlaceTypeNode = {
          ...kind,
          rootId: kind.id,
          parentIds: [],
          depth: 0,
          active: !kind.inactive.includes(kind.conceptId),
          description: "",
        };
        // a tree drawn for a Concept the row no longer holds belongs to the old one
        const children =
          nodeById.get(kind.id)?.conceptId === kind.conceptId ? (below.get(kind.id) ?? []) : [];
        const open = !folded.has(kind.id);
        return (
          <React.Fragment key={kind.id}>
            {showInactive || node.active || !kind.conceptId ? (
              <StyledKindRow $inactive={!!kind.conceptId && !node.active}>
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
                  {treeCell(
                    node,
                    kind.id,
                    0,
                    open,
                    children.length > 0,
                    renderConcept(kind.conceptId, (conceptId) =>
                      onChange(assignConcept(value, kind.id, conceptId))
                    )
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
                      ? "favourite for its gazetteer type"
                      : "make this the favourite for its gazetteer type"
                  }
                  aria-pressed={kind.favorite}
                  onClick={() => onChange(makeFavorite(value, kind.id))}
                >
                  <IconWithTooltip
                    icon={kind.favorite ? <IcoStarFilled /> : <IcoStarOutline />}
                    tooltipText={
                      kind.engineType
                        ? "the favourite is the location type offered first when a suggestion has this gazetteer type"
                        : "choose a gazetteer type to make this a favourite"
                    }
                    tooltipPosition="top"
                  />
                </StyledFavorite>
                {count(node, kind)}
                {description(node)}
                <Button
                  icon={<IcoTrash />}
                  color="danger"
                  inverted
                  tooltipLabel="remove this location type from the list — Classifications already made stay"
                  onClick={() => onChange(value.filter((one) => one.id !== kind.id))}
                  shape="square"
                />
              </StyledKindRow>
            ) : null}
            {open
              ? children.flatMap((child) =>
                  subclassRows(kind, child, `${kind.id}/${child.conceptId}`, 1, new Set([kind.id]))
                )
              : null}
          </React.Fragment>
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
