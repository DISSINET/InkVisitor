import { GeocodingRepresentative } from "@inkvisitor/shared/types/geocoding";
import React from "react";
import { useTheme } from "styled-components";
import { IcoPlaceArchaeological, IcoPlaceChurchTower, IcoPlaceSettlement } from "Theme/icons";
import { GazetteerTag } from "./GazetteerTag";
import { sourceColor } from "./MatchTagStyles";
import {
  StyledChosenRing,
  StyledDistanceLine,
  StyledFigureLabel,
  StyledFigureName,
  StyledFigureScore,
  StyledLegendSwatch,
  StyledMapSymbol,
  StyledRadius,
  StyledRecordDot,
  StyledRule,
  StyledRuleDefault,
  StyledRuleFigure,
  StyledRuleName,
  StyledRuleText,
  StyledRules,
  StyledRulesGrid,
  StyledRulesIntro,
  StyledRulesLegend,
  StyledRulesLegendItem,
  StyledScaleBar,
  StyledTownArea,
  StyledVoteLine,
} from "./RepresentativeRulesStyles";

/**
 * How each rule for a suggestion's coordinate picks its record, on one example
 * drawn once per rule, and then how the citing distance applies to the pick.
 *
 * The example is a church on the edge of a town, searched by its own name: two
 * records at the church, three of the town found by the town's name as the place
 * around it, and Pleiades' record of an ancient site with a similar name about
 * 6 km off, found by a name form the model doubted. One record per gazetteer,
 * all within one suggestion's grouping radius. The places are drawn under the
 * records as a small map, with the app's own marks for a church, a settlement
 * and an archaeological site. Every pick shown is the one hga-engine 0.8.0 `pickRepresentative`
 * makes, with its point precisions, β = 2 and τ = 28 figure units; the test of
 * `CitingSettings` works them out again from `RECORDS`, so moving a record that
 * changes a pick fails it.
 *
 * A vote reaches about as far as the whole group, so it is drawn as a line to the
 * record chosen, as thick as the vote is strong, rather than as an area.
 */

export type RecordId = "wikidata" | "whg" | "pleiades" | "tgn" | "geonames" | "nominatim";

export interface FigureRecord {
  /** The gazetteer, which here is also the record: one record each. */
  id: RecordId;
  x: number;
  y: number;
  /** The engine's match score, as the gazetteer's weight and the match type give it. */
  score: number;
  /** How likely the model judged the name form that found the record. */
  nameScore: number;
  /** Found by the name of the town around the church rather than by the church's own. */
  around: boolean;
  /** Where its score is written in the best-score figure, in pixels from the dot. */
  scoreAt: { dx: number; dy: number; anchor: "start" | "middle" | "end" };
  /** Where its gazetteer is named when it is the record chosen, in pixels from the dot. */
  nameAt: { dx: number; dy: number; anchor: "start" | "middle" | "end" };
}

// the scores are what the engine gives an exact match: 0.85 for a gazetteer of
// full weight, 0.94 for Pleiades, which reports a confidence of its own; whg's is
// an alias match, nominatim's a gazetteer of 0.85 weight
export const RECORDS: FigureRecord[] = [
  {
    id: "wikidata",
    x: 100,
    y: 80,
    score: 0.85,
    nameScore: 0.9,
    around: false,
    scoreAt: { dx: -10, dy: 4, anchor: "end" },
    nameAt: { dx: -12, dy: 4, anchor: "end" },
  },
  {
    id: "whg",
    x: 107,
    y: 73,
    score: 0.63,
    nameScore: 0.9,
    around: false,
    scoreAt: { dx: 0, dy: -10, anchor: "middle" },
    nameAt: { dx: 0, dy: -14, anchor: "middle" },
  },
  {
    id: "pleiades",
    x: 150,
    y: 42,
    score: 0.94,
    nameScore: 0.4,
    around: false,
    scoreAt: { dx: 12, dy: 4, anchor: "start" },
    nameAt: { dx: -12, dy: 4, anchor: "end" },
  },
  {
    id: "tgn",
    x: 124,
    y: 84,
    score: 0.85,
    nameScore: 0.6,
    around: true,
    scoreAt: { dx: -2, dy: 18, anchor: "middle" },
    nameAt: { dx: -4, dy: 22, anchor: "middle" },
  },
  {
    id: "geonames",
    x: 131,
    y: 80,
    score: 0.85,
    nameScore: 0.6,
    around: true,
    scoreAt: { dx: 0, dy: -10, anchor: "middle" },
    nameAt: { dx: 0, dy: -14, anchor: "middle" },
  },
  {
    id: "nominatim",
    x: 138,
    y: 86,
    score: 0.78,
    nameScore: 0.6,
    around: true,
    scoreAt: { dx: 4, dy: 18, anchor: "middle" },
    nameAt: { dx: 4, dy: 22, anchor: "middle" },
  },
];

/** The engine's distance scale for a religious site, in figure units: a vote falls to a third over it. */
export const TAU = 28;

/** How often a gazetteer's record lies on the place itself: hga-engine 0.8.0 `POINT_PRECISION`. */
export const POINT_PRECISION: Record<RecordId, number> = {
  pleiades: 0.793,
  nominatim: 0.607,
  wikidata: 0.595,
  whg: 0.571,
  geonames: 0.446,
  tgn: 0.409,
};

const distance = (a: FigureRecord, b: FigureRecord) => Math.hypot(a.x - b.x, a.y - b.y);
/** The engine's record quality: the match score times the name form's prior. */
const quality = (record: FigureRecord) => record.score * (0.5 + 0.5 * record.nameScore);
/** A record's weight in `agreement`'s vote, quality to the power β = 2. */
export const agreementWeight = (record: FigureRecord) => quality(record) ** 2;
/** The same in `place first`: also its gazetteer's point precision squared and its name form's score cubed. */
export const placeWeight = (record: FigureRecord) =>
  agreementWeight(record) * POINT_PRECISION[record.id] ** 2 * record.nameScore ** 3;
/** The vote `record` gives `candidate`: its weight, falling with distance over τ. */
export const vote = (weight: (record: FigureRecord) => number, record: FigureRecord, candidate: FigureRecord) =>
  weight(record) * Math.exp(-distance(candidate, record) / TAU);
/** Half of it: the radius `densest` counts within, and a religious site's default citing distance. */
const HALF_TAU = TAU / 2;

/** The part of the plane the figures show, in figure units. */
const VIEW = { x: 72, y: 28, width: 98, height: 74 };
/** CSS pixels per figure unit. Text and dots keep their pixel size; positions and radii scale. */
const SCALE = 3;
/** A point of the plane in the figure's own pixels. */
const at = (x: number, y: number) => ({ x: (x - VIEW.x) * SCALE, y: (y - VIEW.y) * SCALE });

/**
 * Where the places' marks are drawn, in figure units: beside the records that
 * place them rather than under them, so no vote line crosses a mark.
 */
const PLACES = {
  church: { x: 95, y: 72 },
  town: { x: 131, y: 85, rx: 15, ry: 10 },
  ancientSite: { x: 150, y: 33 },
};
/** A kilometre in figure units: τ for a religious site is 3 km. */
const KM = TAU / 3;
/** The size a place's mark is drawn at, in pixels. */
const SYMBOL = 20;

/** A place's mark centred on a point of the plane. */
const PlaceMark: React.FC<{ icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; x: number; y: number }> = ({
  icon: Icon,
  x,
  y,
}) => {
  const point = at(x, y);
  return (
    <Icon x={point.x - SYMBOL / 2} y={point.y - SYMBOL / 2} width={SYMBOL} height={SYMBOL} />
  );
};

/** The map under the records: the town's built-up area, the places' marks and a scale. */
const PlacesMap: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const town = at(PLACES.town.x, PLACES.town.y);
  const scale = KM * SCALE;
  return (
    <>
      <StyledTownArea cx={town.x} cy={town.y} rx={PLACES.town.rx * SCALE} ry={PLACES.town.ry * SCALE} />
      <StyledMapSymbol>
        <PlaceMark icon={IcoPlaceChurchTower} {...PLACES.church} />
        <PlaceMark icon={IcoPlaceSettlement} x={PLACES.town.x} y={PLACES.town.y + 6} />
        <PlaceMark icon={IcoPlaceArchaeological} {...PLACES.ancientSite} />
      </StyledMapSymbol>
      <StyledScaleBar>
        <path d={`M ${width - 12 - scale} ${height - 14} v 4 h ${scale} v -4`} />
        <StyledFigureLabel x={width - 12 - scale / 2} y={height - 16} textAnchor="middle">
          1 km
        </StyledFigureLabel>
      </StyledScaleBar>
    </>
  );
};

type Overlay = "placeVotes" | "votes" | "scores" | "distances" | "density" | "citing";

export interface Panel {
  key: GeocodingRepresentative | "citing";
  name: string;
  isDefault?: boolean;
  chosen: RecordId;
  overlay: Overlay;
  text: string;
  /** What the figure shows, for a reader who cannot see it. */
  says: string;
}

export const PANELS: Panel[] = [
  {
    key: "place-first",
    name: "place first",
    isDefault: true,
    chosen: "wikidata",
    overlay: "placeVotes",
    text:
      "Only a record found by the place's own name can be chosen. Records found by the name of " +
      "the place around it still vote, and are chosen only when nothing else was found. Votes " +
      "count as in agreement, each also weighted by how precisely its gazetteer places records " +
      "and by how likely the model judged the name form (the lines: the votes the record chosen " +
      "got). Here: the church; the ancient site was found by a name form the model doubted.",
    says: "the wikidata record at the church is chosen",
  },
  {
    key: "agreement",
    name: "agreement",
    chosen: "tgn",
    overlay: "votes",
    text:
      "Each gazetteer votes for every record, with the best of its own records for that spot: " +
      "the better matched and the closer, the stronger the vote. The record with the most votes " +
      "wins; the lines are the votes it got, thicker for a stronger one. Here: the town record " +
      "nearest the church, which the church's records support too.",
    says: "the tgn record of the town, nearest the church, is chosen",
  },
  {
    key: "best-score",
    name: "best score",
    chosen: "pleiades",
    overlay: "scores",
    text:
      "The record with the highest match score, wherever it lies; the only rule of engines " +
      "before 0.6. Here: Pleiades' ancient site 6 km off, which scores highest because Pleiades " +
      "reports a confidence of its own, though no other gazetteer agrees with it.",
    says: "the pleiades record of the ancient site 6 km off is chosen, with the score 0.94",
  },
  {
    key: "medoid",
    name: "medoid",
    chosen: "geonames",
    overlay: "distances",
    text:
      "Each gazetteer's best-scored record only. The one with the smallest total distance to " +
      "the others (the lines), whatever the scores. Here: the middle of the town.",
    says: "the geonames record in the middle of the town is chosen",
  },
  {
    key: "densest",
    name: "densest",
    chosen: "geonames",
    overlay: "density",
    text:
      "Each gazetteer's best-scored record only. The one with the most others within half of τ, " +
      "the engine's distance scale for the gazetteer location type (dashed). Here: the middle " +
      "of the town, with two others within.",
    says: "the geonames record in the middle of the town is chosen, with two others within the circle",
  },
  {
    key: "citing",
    name: "then: citing",
    chosen: "wikidata",
    overlay: "citing",
    text:
      "The chosen record's gazetteer is cited, and every other gazetteer with a record within " +
      "the citing distance set below; for a religious site its default is half of τ (dashed). " +
      "With the default rule here: wikidata and whg. The town's records and the ancient site " +
      "were grouped with them but are not cited.",
    says: "the wikidata record is chosen; wikidata and whg are cited, the others are not",
  },
];

const recordOf = (id: RecordId): FigureRecord => RECORDS.find((record) => record.id === id)!;
const BEST_SCORE = Math.max(...RECORDS.map((record) => record.score));

/** Whether a record takes part in what a figure shows; the rest are drawn faded. */
const takesPart = (panel: Panel, record: FigureRecord): boolean => {
  const chosen = recordOf(panel.chosen);
  switch (panel.overlay) {
    case "citing":
    case "density":
      return distance(chosen, record) <= HALF_TAU;
    default:
      return true;
  }
};

const RuleFigure: React.FC<{ panel: Panel }> = ({ panel }) => {
  const theme = useTheme();
  const chosen = recordOf(panel.chosen);
  const chosenAt = at(chosen.x, chosen.y);
  const width = VIEW.width * SCALE;
  const height = VIEW.height * SCALE;
  const weight = panel.overlay === "placeVotes" ? placeWeight : agreementWeight;
  const voters =
    panel.overlay === "votes" || panel.overlay === "placeVotes"
      ? RECORDS.filter((record) => record !== chosen)
      : [];
  const strongest = Math.max(...voters.map((record) => vote(weight, record, chosen)), 0);
  return (
    <StyledRuleFigure
      role="img"
      aria-label={`${panel.name}: ${panel.says}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <PlacesMap width={width} height={height} />
      {voters.map((record) => (
        <StyledVoteLine
          key={`vote-${record.id}`}
          x1={at(record.x, record.y).x}
          y1={at(record.x, record.y).y}
          x2={chosenAt.x}
          y2={chosenAt.y}
          strokeWidth={0.5 + (5.5 * vote(weight, record, chosen)) / strongest}
          $color={sourceColor(theme, record.id)}
        />
      ))}
      {panel.overlay === "distances"
        ? RECORDS.filter((record) => record !== chosen).map((record) => (
            <StyledDistanceLine
              key={`line-${record.id}`}
              x1={chosenAt.x}
              y1={chosenAt.y}
              x2={at(record.x, record.y).x}
              y2={at(record.x, record.y).y}
            />
          ))
        : null}
      {panel.overlay === "density" || panel.overlay === "citing" ? (
        <StyledRadius cx={chosenAt.x} cy={chosenAt.y} r={HALF_TAU * SCALE} />
      ) : null}

      {RECORDS.map((record) => (
        <StyledRecordDot
          key={record.id}
          cx={at(record.x, record.y).x}
          cy={at(record.x, record.y).y}
          r={4.5}
          $color={sourceColor(theme, record.id)}
          $around={record.around}
          $faded={!takesPart(panel, record)}
        />
      ))}
      {panel.overlay === "scores"
        ? RECORDS.map((record) => (
            <StyledFigureScore
              key={`score-${record.id}`}
              x={at(record.x, record.y).x + record.scoreAt.dx}
              y={at(record.x, record.y).y + record.scoreAt.dy}
              textAnchor={record.scoreAt.anchor}
              $best={record.score === BEST_SCORE}
            >
              {record.score.toFixed(2).replace(/^0/, "")}
            </StyledFigureScore>
          ))
        : null}
      <StyledChosenRing cx={chosenAt.x} cy={chosenAt.y} r={9} />
      {panel.overlay === "scores" ? null : (
        <StyledFigureName
          x={chosenAt.x + chosen.nameAt.dx}
          y={chosenAt.y + chosen.nameAt.dy}
          textAnchor={chosen.nameAt.anchor}
          $color={sourceColor(theme, chosen.id)}
        >
          {chosen.id}
        </StyledFigureName>
      )}
    </StyledRuleFigure>
  );
};

/** A legend's sample, drawn with the figures' own shapes. */
const Swatch: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StyledLegendSwatch width={20} height={20} viewBox="-10 -10 20 20" aria-hidden>
    {children}
  </StyledLegendSwatch>
);

interface RepresentativeRules {
  /** The rule the settings hold, marked among the figures. */
  selected: GeocodingRepresentative;
}

export const RepresentativeRules: React.FC<RepresentativeRules> = ({ selected }) => {
  const theme = useTheme();
  const sample = theme.color["greyer"];
  return (
    <StyledRules>
      <StyledRulesIntro>
        A suggestion groups the records found within 2.5 times τ of one another, τ being the
        engine&apos;s distance scale for the gazetteer location type (3 km for a church, so 7.5
        km). Its coordinate is always one of those records, never an average of them, so it can
        be traced to a gazetteer; the rule decides which. Every rule but best score passes over
        the model&apos;s own guess (llm-coords) while a gazetteer found something. The figures
        follow one example through every rule: a church on the edge of a town, searched by its
        own name. Two gazetteers place the church; three place the town, found by its name as the
        place around the church; and Pleiades places an ancient site with a similar name about 6
        km off, found by a name form the model doubted. Each gazetteer returned one record.
      </StyledRulesIntro>
      <StyledRulesLegend>
        <StyledRulesLegendItem>
          <Swatch>
            <StyledRecordDot cx={0} cy={0} r={4.5} $color={sample} $around={false} $faded={false} />
          </Swatch>
          found by the place&apos;s own name
        </StyledRulesLegendItem>
        <StyledRulesLegendItem>
          <Swatch>
            <StyledRecordDot cx={0} cy={0} r={4.5} $color={sample} $around $faded={false} />
          </Swatch>
          found by the name of the place around it
        </StyledRulesLegendItem>
        <StyledRulesLegendItem>
          <Swatch>
            <StyledRecordDot cx={0} cy={0} r={4.5} $color={sample} $around={false} $faded={false} />
            <StyledChosenRing cx={0} cy={0} r={9} />
          </Swatch>
          the record chosen
        </StyledRulesLegendItem>
        <StyledRulesLegendItem>
          <Swatch>
            <StyledRecordDot cx={0} cy={0} r={4.5} $color={sample} $around={false} $faded />
          </Swatch>
          no part in that rule
        </StyledRulesLegendItem>
        <StyledRulesLegendItem>
          {RECORDS.map((record) => (
            <GazetteerTag key={record.id} source={record.id} />
          ))}
        </StyledRulesLegendItem>
      </StyledRulesLegend>
      <StyledRulesLegend>
        <StyledRulesLegendItem>
          <StyledMapSymbol as="span">
            <IcoPlaceChurchTower />
          </StyledMapSymbol>
          the church searched for
        </StyledRulesLegendItem>
        <StyledRulesLegendItem>
          <StyledMapSymbol as="span">
            <IcoPlaceSettlement />
          </StyledMapSymbol>
          the town around it, its built-up area shaded
        </StyledRulesLegendItem>
        <StyledRulesLegendItem>
          <StyledMapSymbol as="span">
            <IcoPlaceArchaeological />
          </StyledMapSymbol>
          an ancient site with a similar name
        </StyledRulesLegendItem>
      </StyledRulesLegend>
      <StyledRulesGrid>
        {PANELS.map((panel) => (
          <StyledRule key={panel.key} $selected={panel.key === selected}>
            <StyledRuleName>
              {panel.name}
              {panel.isDefault ? <StyledRuleDefault>the engine&apos;s default</StyledRuleDefault> : null}
              {panel.key === selected ? <StyledRuleDefault>chosen in these settings</StyledRuleDefault> : null}
            </StyledRuleName>
            <RuleFigure panel={panel} />
            <StyledRuleText>{panel.text}</StyledRuleText>
          </StyledRule>
        ))}
      </StyledRulesGrid>
    </StyledRules>
  );
};
