import {
  ENGINE_PLACE_TYPE_INFO,
  GEOCODING_PLACE_TYPES,
  GeocodingPlaceType,
  IGeocodingPlaceType,
} from "@inkvisitor/shared/types/geocoding";
import { IEntity } from "@inkvisitor/shared/types";
import { Button, Checkbox, IconWithTooltip, Input, Tooltip } from "components";
import Dropdown, { EntityTag } from "components/advanced";
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
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
 * Free to define on a location type: the Concept a Location is classified
 * under, whose label is what the type is called, a mark, and the gazetteer location type
 * it answers to. The gazetteer location
 * type is what connects a suggestion's own type to the project's vocabulary, and
 * the star marks the location type offered first where several answer to the
 * same gazetteer location type. Every subclass of the Concept, at every depth, is a
 * location type of its own that shares the mark and the gazetteer location type of the
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
  /** Whether a Concept has been read, so its detail can be edited without replacing one not yet shown. */
  detailReady: (conceptId: string) => boolean;
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

/**
 * How tall the grid of marks is, in pixels: rows of ten 2.2rem marks with
 * 0.25rem gaps and its padding, at the app's 10px rem. It opens upward where it
 * does not fit below the button, and never above the window's top edge.
 */
const PANEL_HEIGHT = Math.ceil(PLACE_ICON_KEYS.length / 10) * 24.5 + 16;

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
 * A location type such as "church" is paired with a gazetteer location type,
 * whose names mean more than they say, and "religious house" is the one that
 * covers it. Opened by
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
            <p>The types the gazetteers use. Choose the one that covers your location type:</p>
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

/** What a row's count stands on: no Concept, a failed read, an answer awaited, or an answer. */
type CountState = "unassigned" | "failed" | "loading" | "ready";

/** How many Locations come under a row, at it or below it, and how many of those only through something below. */
const CountCell: React.FC<{
  state: CountState;
  count: number;
  inferred: number;
  truncated: boolean;
}> = React.memo(({ state, count, inferred, truncated }) => (
  <StyledKindCount>
    {state === "unassigned" ? "–" : state === "failed" ? "?" : state === "loading" ? "…" : count}
    {state === "ready" && inferred ? (
      <IconWithTooltip
        icon={<StyledKindInferred>+{inferred}</StyledKindInferred>}
        tooltipText={`${inferred} of these are classified under a subclass or a synonym of this Concept, not under the Concept itself.`}
        tooltipPosition="top"
      />
    ) : null}
    {truncated ? (
      <IconWithTooltip
        icon={<IcoWarning />}
        color="warning"
        tooltipText="This Concept has more subclasses than can be followed, so the deepest are not listed, Locations classified under them are not counted and they show no location type. Assign a narrower Concept."
        tooltipPosition="top"
      />
    ) : null}
  </StyledKindCount>
));

/** The fold toggle, the tick, then whatever names the Concept. */
const TreeCell: React.FC<{
  depth: number;
  open: boolean;
  hasChildren: boolean;
  /** What the fold toggle names. */
  name: string;
  onToggleFold: () => void;
  /** No tick where the row has no Concept yet. */
  tick: { active: boolean; onChange: (active: boolean) => void } | null;
  children: React.ReactNode;
}> = ({ depth, open, hasChildren, name, onToggleFold, tick, children }) => (
  <StyledTreeCell $depth={depth}>
    {hasChildren ? (
      <StyledFoldToggle
        type="button"
        $open={open}
        aria-expanded={open}
        aria-label={open ? `fold the subclasses of ${name}` : `show the subclasses of ${name}`}
        onClick={onToggleFold}
      >
        <IcoChevronRight />
      </StyledFoldToggle>
    ) : (
      <StyledFoldSpacer />
    )}
    {tick ? (
      <Checkbox
        value={tick.active}
        onChangeFn={tick.onChange}
        tooltipLabel={
          tick.active
            ? "offered when a location type is assigned; untick to stop offering it"
            : "not offered when a location type is assigned; Locations already classified under it keep it"
        }
      />
    ) : null}
    {children}
  </StyledTreeCell>
);

/** The Concept's detail, edited in place once the Concept has been read. */
const DescriptionCell: React.FC<{
  conceptId: string;
  detail: string;
  ready: boolean;
  onChange: (conceptId: string, detail: string) => void;
}> = ({ conceptId, detail, ready, onChange }) => (
  <Input
    type="textarea"
    rows={1}
    value={conceptId ? detail : ""}
    onChangeFn={(next) => onChange(conceptId, next)}
    placeholder={
      !conceptId ? "assign a Concept first" : ready ? "the Concept's detail" : "reading the Concept"
    }
    disabled={!conceptId || !ready}
    changeOnType
    width="full"
  />
);

interface SubclassRow {
  /** Where in the tree the row is, which a Concept with two superclasses has two of. */
  path: string;
  depth: number;
  open: boolean;
  hasChildren: boolean;
  /** The mark of the location type at the root, which the row shares. */
  icon: string;
  name: string;
  rootId: string;
  conceptId: string;
  active: boolean;
  concept: IEntity | undefined;
  countState: CountState;
  count: number;
  inferred: number;
  detail: string;
  /** Whether the Concept has been read, so its detail can be edited. */
  detailReady: boolean;
  onToggleFold: (path: string) => void;
  onSetActive: (rootId: string, conceptId: string, active: boolean) => void;
  onDetailChange: (conceptId: string, detail: string) => void;
}

/**
 * One subclass of a location type's Concept.
 *
 * A tree can hold hundreds of them, and the table renders again on every key
 * typed anywhere in the window, so a row takes only plain values and callbacks
 * that keep their identity, and renders again only when one of its own changes.
 */
const SubclassRow: React.FC<SubclassRow> = React.memo(
  ({
    path,
    depth,
    open,
    hasChildren,
    icon,
    name,
    rootId,
    conceptId,
    active,
    concept,
    countState,
    count,
    inferred,
    detail,
    detailReady,
    onToggleFold,
    onSetActive,
    onDetailChange,
  }) => {
    return (
      <StyledKindRow $inactive={!active}>
        <StyledInheritedMark aria-hidden>{React.createElement(placeIcon(icon))}</StyledInheritedMark>
        <TreeCell
          depth={depth}
          open={open}
          hasChildren={hasChildren}
          name={name}
          onToggleFold={() => onToggleFold(path)}
          tick={{ active, onChange: (next) => onSetActive(rootId, conceptId, next) }}
        >
          {concept ? (
            <EntityTag
              entity={concept}
              fullWidth
              disableTooltip
              disableDrag
              disableCopyToClipboard
            />
          ) : (
            <span>{name || "…"}</span>
          )}
        </TreeCell>
        <span />
        <span />
        <CountCell state={countState} count={count} inferred={inferred} truncated={false} />
        <DescriptionCell
          conceptId={conceptId}
          detail={detail}
          ready={detailReady}
          onChange={onDetailChange}
        />
        <span />
      </StyledKindRow>
    );
  }
);

export const PlaceTypeTable: React.FC<PlaceTypeTable> = ({
  value,
  onChange,
  nodes,
  concepts,
  detailOf,
  detailReady,
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

  // the callbacks every subclass row is handed keep their identity for the life
  // of the table, so a row the edit did not touch is not rendered again; they
  // read the list and the handlers as they are when called
  const latest = useRef({ value, onChange, onDetailChange });
  useLayoutEffect(() => {
    latest.current = { value, onChange, onDetailChange };
  });

  const setActive = useCallback((rootId: string, conceptId: string, active: boolean) => {
    const { value: current, onChange: change } = latest.current;
    change(
      current.map((one) =>
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
  }, []);

  const toggleFold = useCallback(
    (path: string) =>
      setFolded((current) => {
        const next = new Set(current);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      }),
    []
  );

  const changeDetail = useCallback(
    (conceptId: string, detail: string) => latest.current.onDetailChange(conceptId, detail),
    []
  );

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

  const countStateOf = (rootId: string, conceptId: string): CountState =>
    !conceptId
      ? "unassigned"
      : countsFailed
        ? "failed"
        : countsLoading || pendingTypes.includes(rootId)
          ? "loading"
          : "ready";

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
    const rows: React.ReactNode[] = [];
    if (showInactive || node.active) {
      rows.push(
        <SubclassRow
          key={path}
          path={path}
          depth={depth}
          open={open}
          hasChildren={children.length > 0}
          icon={kind.icon}
          name={node.name}
          rootId={node.rootId}
          conceptId={node.conceptId}
          active={node.active}
          concept={concepts[node.conceptId]}
          countState={countStateOf(kind.id, node.conceptId)}
          count={counts[node.id] ?? 0}
          inferred={inferredCounts[node.id] ?? 0}
          detail={detailOf(node.conceptId)}
          detailReady={detailReady(node.conceptId)}
          onToggleFold={toggleFold}
          onSetActive={setActive}
          onDetailChange={changeDetail}
        />
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
        // the Concept's label once it is in, which is what the row is called
        const name = nodeById.get(kind.id)?.name || kind.name || "this location type";
        return (
          <React.Fragment key={kind.id}>
            {showInactive || node.active || !kind.conceptId ? (
              <StyledKindRow $inactive={!!kind.conceptId && !node.active}>
                <StyledIconAnchor>
                  <StyledIconButton
                    type="button"
                    $open={iconFor?.id === kind.id}
                    aria-label={`mark for ${name}`}
                    onClick={(event) => {
                      const box = event.currentTarget.getBoundingClientRect();
                      setIconFor(
                        iconFor?.id === kind.id
                          ? null
                          : {
                              id: kind.id,
                              top:
                                box.bottom + PANEL_HEIGHT > window.innerHeight
                                  ? Math.max(0, box.top - PANEL_HEIGHT)
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
                <StyledKindCell>
                  <TreeCell
                    depth={0}
                    open={open}
                    hasChildren={children.length > 0}
                    name={name}
                    onToggleFold={() => toggleFold(kind.id)}
                    tick={
                      kind.conceptId
                        ? {
                            active: node.active,
                            onChange: (active) => setActive(kind.id, kind.conceptId, active),
                          }
                        : null
                    }
                  >
                    {renderConcept(kind.conceptId, (conceptId) =>
                      onChange(assignConcept(value, kind.id, conceptId))
                    )}
                  </TreeCell>
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
                <CountCell
                  state={countStateOf(kind.id, kind.conceptId)}
                  count={counts[kind.id] ?? 0}
                  inferred={inferredCounts[kind.id] ?? 0}
                  truncated={truncatedTypes.includes(kind.id)}
                />
                <DescriptionCell
                  conceptId={kind.conceptId}
                  detail={kind.conceptId ? detailOf(kind.conceptId) : ""}
                  ready={!!kind.conceptId && detailReady(kind.conceptId)}
                  onChange={changeDetail}
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
