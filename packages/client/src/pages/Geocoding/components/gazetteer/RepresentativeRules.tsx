import { GeocodingRepresentative } from "@inkvisitor/shared/types/geocoding";
import React, { useState } from "react";
import { useTheme } from "styled-components";
import {
  IcoPlaceCastle,
  IcoPlaceChurchTower,
  IcoPlaceHouse,
  IcoPlaceRegion,
  IcoPlaceSettlement,
} from "Theme/icons";
import { GazetteerTag } from "./GazetteerTag";
import { sourceColor } from "./MatchTagStyles";
import {
  StyledArea,
  StyledCaseButton,
  StyledCaseStory,
  StyledCaseSwitch,
  StyledChosenRing,
  StyledDistanceLine,
  StyledFigureLabel,
  StyledFigureName,
  StyledFigureScore,
  StyledGuide,
  StyledGuideCell,
  StyledGuideHead,
  StyledGuideRule,
  StyledLegendSwatch,
  StyledMapSymbol,
  StyledRadius,
  StyledRecordDot,
  StyledRule,
  StyledRuleDefault,
  StyledRuleFigure,
  StyledRuleName,
  StyledRules,
  StyledRulesGrid,
  StyledRulesIntro,
  StyledRulesLegend,
  StyledRulesLegendItem,
  StyledScaleBar,
  StyledVerdict,
  StyledVoteLine,
} from "./RepresentativeRulesStyles";

/**
 * How each rule for a suggestion's coordinate picks its record within one
 * suggestion, on four cases a researcher can switch between, and when each rule
 * suits or misleads. Each case is one suggestion: choosing between suggestions is
 * the researcher's, not a rule's.
 *
 * One example cannot show the rules apart: on any one of them several rules
 * agree, and some look strictly better than others. So every case is drawn once
 * per rule, each figure says whether its rule found the place, and every rule is
 * right in one case at least and wrong in another.
 *
 * In every case each gazetteer returned one record, all within one suggestion's
 * grouping radius. Every pick shown is the one hga-engine 0.8.0
 * `pickRepresentative` makes, with its point precisions and β = 2, at τ = 28
 * figure units; the test of `CitingSettings` works them out again from `CASES`,
 * so moving a record that changes a pick fails it. A vote reaches about as far
 * as the whole group, so it is drawn as a line to the record chosen, as thick as
 * the vote is strong.
 */

export type RecordId = "wikidata" | "whg" | "pleiades" | "tgn" | "geonames" | "nominatim";

type Anchor = "start" | "middle" | "end";
interface Offset {
  dx: number;
  dy: number;
  anchor: Anchor;
}

type MatchType = "exact" | "alias" | "fuzzy";

/**
 * What the engine knows of each gazetteer drawn: its weight, the confidence it
 * reports, the match types it can return, and how often its record lies on the
 * place itself. hga-engine 0.8.0 `SOURCE_WEIGHTS`, the suggesters' `confidence`
 * and `classifyMatch` fallback, and `POINT_PRECISION`.
 */
export const GAZETTEERS: Record<
  RecordId,
  { weight: number; confidence: number | null; matches: MatchType[]; precision: number }
> = {
  wikidata: { weight: 1, confidence: 0.8, matches: ["exact", "alias"], precision: 0.595 },
  tgn: { weight: 1, confidence: 0.8, matches: ["exact", "alias"], precision: 0.409 },
  pleiades: { weight: 1, confidence: 0.8, matches: ["exact", "alias"], precision: 0.793 },
  geonames: { weight: 1, confidence: null, matches: ["exact", "fuzzy"], precision: 0.446 },
  whg: { weight: 0.85, confidence: 0.8, matches: ["exact", "fuzzy"], precision: 0.571 },
  nominatim: { weight: 0.85, confidence: null, matches: ["exact", "fuzzy"], precision: 0.607 },
};

/** hga-engine 0.8.0 `MATCH_TYPE_SCORE`. */
const MATCH_SCORE: Record<MatchType, number> = { exact: 1, alias: 0.75, fuzzy: 0.45 };

export interface FigureRecord {
  /** The gazetteer, which here is also the record: one record each. */
  id: RecordId;
  x: number;
  y: number;
  match: MatchType;
  /** The confidence this record reports, where its gazetteer's varies by record (Nominatim's importance). */
  confidence?: number;
  /** How likely the model judged the name form that found the record. */
  nameScore: number;
  /** Found by the name of a place around the one searched rather than by its own. */
  around?: boolean;
  /** The place the record stands for, as a verdict names it. */
  place: string;
  /** Where its score is written in the best-score figure, in pixels from the dot. */
  scoreAt?: Offset;
  /** Where its gazetteer is named when it is the record chosen, in pixels from the dot. */
  nameAt?: Offset;
}

/** hga-engine 0.8.0 `matchScore`: weight times match type, lifted by a confidence above a half. */
export const matchScore = (record: FigureRecord): number => {
  const gazetteer = GAZETTEERS[record.id];
  const confidence = record.confidence ?? gazetteer.confidence;
  const lift = confidence === null ? 0 : Math.max(0, (confidence - 0.5) * 2);
  return Math.min(1, 0.85 * gazetteer.weight * MATCH_SCORE[record.match] + 0.15 * lift);
};

interface PlaceMark {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  x: number;
  y: number;
  /** What the mark stands for, in the case's legend. */
  label: string;
}

interface Area {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

export interface FigureCase {
  key: "church" | "crowd" | "region" | "municipality";
  /** The switch's label. */
  label: string;
  story: string;
  /** τ for the case's gazetteer location type, which sets the scale. */
  tauKm: number;
  /** The length the scale bar shows. */
  scaleKm: number;
  records: FigureRecord[];
  /** The records standing for the place searched: a rule that picks one of them found it. */
  right: RecordId[];
  marks: PlaceMark[];
  areas: Area[];
  /** The record each rule picks. */
  picks: Record<GeocodingRepresentative, RecordId>;
}

const ABOVE: Offset = { dx: 0, dy: -9, anchor: "middle" };
const BELOW: Offset = { dx: 0, dy: 17, anchor: "middle" };
const LEFT: Offset = { dx: -11, dy: 4, anchor: "end" };
const RIGHT: Offset = { dx: 11, dy: 4, anchor: "start" };

export const CASES: FigureCase[] = [
  {
    key: "church",
    label: "church in a town",
    story:
      "A church on the edge of a town, searched by its own name. Wikidata (by an alternative name) " +
      "and WHG place the church; three gazetteers place the town, found by its name as the place " +
      "around the church.",
    tauKm: 3,
    scaleKm: 1,
    records: [
      { id: "wikidata", x: 100, y: 66, match: "alias", nameScore: 0.9, place: "the church", scoreAt: LEFT, nameAt: LEFT },
      { id: "whg", x: 106, y: 61, match: "exact", nameScore: 0.9, place: "the church", scoreAt: ABOVE, nameAt: ABOVE },
      { id: "tgn", x: 128, y: 70, match: "exact", nameScore: 0.6, around: true, place: "the town", scoreAt: BELOW, nameAt: BELOW },
      { id: "geonames", x: 134, y: 66, match: "exact", nameScore: 0.6, around: true, place: "the town", scoreAt: ABOVE, nameAt: ABOVE },
      { id: "nominatim", x: 140, y: 71, match: "exact", confidence: 0.7, nameScore: 0.6, around: true, place: "the town", scoreAt: BELOW, nameAt: BELOW },
    ],
    right: ["wikidata", "whg"],
    marks: [
      { icon: IcoPlaceChurchTower, x: 94, y: 57, label: "the church searched for" },
      { icon: IcoPlaceSettlement, x: 147, y: 63, label: "the town around it" },
    ],
    areas: [{ x: 127, y: 68, rx: 20, ry: 9 }],
    picks: {
      "place-first": "whg",
      agreement: "tgn",
      "best-score": "tgn",
      medoid: "tgn",
      densest: "tgn",
    },
  },
  {
    key: "crowd",
    label: "exact match, loose crowd",
    story:
      "A village searched by its name. Wikidata and GeoNames match it exactly; three gazetteers " +
      "match a hamlet nearby only loosely, TGN by an alternative name, WHG and Nominatim by fuzzy " +
      "matches.",
    tauKm: 10,
    scaleKm: 5,
    records: [
      { id: "wikidata", x: 100, y: 62, match: "exact", nameScore: 0.9, place: "the village", scoreAt: LEFT, nameAt: LEFT },
      { id: "geonames", x: 105, y: 66, match: "exact", nameScore: 0.9, place: "the village", scoreAt: BELOW, nameAt: BELOW },
      { id: "tgn", x: 140, y: 58, match: "alias", nameScore: 0.9, place: "the hamlet", scoreAt: ABOVE, nameAt: ABOVE },
      { id: "whg", x: 148, y: 61, match: "fuzzy", nameScore: 0.9, place: "the hamlet", scoreAt: BELOW, nameAt: BELOW },
      { id: "nominatim", x: 156, y: 58, match: "fuzzy", confidence: 0.6, nameScore: 0.9, place: "the hamlet", scoreAt: ABOVE, nameAt: ABOVE },
    ],
    right: ["wikidata", "geonames"],
    marks: [
      { icon: IcoPlaceSettlement, x: 94, y: 55, label: "the village searched for" },
      { icon: IcoPlaceHouse, x: 163, y: 65, label: "a hamlet with a similar name" },
    ],
    areas: [],
    picks: {
      "place-first": "wikidata",
      agreement: "wikidata",
      "best-score": "wikidata",
      medoid: "tgn",
      densest: "whg",
    },
  },
  {
    key: "region",
    label: "region named after its capital",
    story:
      "A duchy named after its capital, searched by that name. Two gazetteers place the duchy at " +
      "its middle; two place the capital city on its western edge; two place towns of similar " +
      "names on its eastern edge.",
    tauKm: 60,
    scaleKm: 30,
    records: [
      { id: "tgn", x: 98, y: 64, match: "exact", nameScore: 0.9, place: "the capital", scoreAt: BELOW, nameAt: BELOW },
      { id: "whg", x: 102, y: 60, match: "exact", nameScore: 0.9, place: "the capital", scoreAt: ABOVE, nameAt: ABOVE },
      { id: "wikidata", x: 131, y: 58, match: "alias", nameScore: 0.7, place: "the duchy's middle", scoreAt: ABOVE, nameAt: ABOVE },
      { id: "geonames", x: 137, y: 63, match: "exact", nameScore: 0.7, place: "the duchy's middle", scoreAt: BELOW, nameAt: BELOW },
      { id: "pleiades", x: 163, y: 55, match: "alias", nameScore: 0.5, place: "a town of a similar name", scoreAt: ABOVE, nameAt: ABOVE },
      { id: "nominatim", x: 166, y: 61, match: "fuzzy", confidence: 0.6, nameScore: 0.6, place: "a town of a similar name", scoreAt: BELOW, nameAt: BELOW },
    ],
    right: ["wikidata", "geonames"],
    marks: [
      { icon: IcoPlaceRegion, x: 124, y: 66, label: "the duchy searched for" },
      { icon: IcoPlaceCastle, x: 91, y: 56, label: "its capital, of the same name" },
      { icon: IcoPlaceSettlement, x: 172, y: 50, label: "towns of similar names" },
    ],
    areas: [{ x: 131, y: 60, rx: 39, ry: 13 }],
    picks: {
      "place-first": "whg",
      agreement: "whg",
      "best-score": "tgn",
      medoid: "wikidata",
      densest: "tgn",
    },
  },
  {
    key: "municipality",
    label: "village and its municipality",
    story:
      "A village searched by its name, which its municipality shares. Wikidata and GeoNames match " +
      "the municipality exactly and place it at its seat, a few km away; four gazetteers find the " +
      "village itself, under older spellings the model judged less likely.",
    tauKm: 10,
    scaleKm: 5,
    records: [
      { id: "wikidata", x: 100, y: 58, match: "exact", nameScore: 0.9, place: "the municipality's seat", scoreAt: LEFT, nameAt: LEFT },
      { id: "geonames", x: 104, y: 62, match: "exact", nameScore: 0.9, place: "the municipality's seat", scoreAt: BELOW, nameAt: BELOW },
      { id: "tgn", x: 121, y: 64, match: "alias", nameScore: 0.5, place: "the village", scoreAt: LEFT, nameAt: LEFT },
      { id: "whg", x: 126, y: 60, match: "exact", nameScore: 0.5, place: "the village", scoreAt: ABOVE, nameAt: ABOVE },
      { id: "nominatim", x: 131, y: 64, match: "exact", confidence: 0.6, nameScore: 0.5, place: "the village", scoreAt: RIGHT, nameAt: RIGHT },
      { id: "pleiades", x: 126, y: 68, match: "alias", nameScore: 0.5, place: "the village", scoreAt: BELOW, nameAt: BELOW },
    ],
    right: ["tgn", "whg", "nominatim", "pleiades"],
    marks: [
      { icon: IcoPlaceHouse, x: 137, y: 56, label: "the village searched for" },
      { icon: IcoPlaceSettlement, x: 94, y: 51, label: "the seat of its municipality" },
    ],
    areas: [],
    picks: {
      "place-first": "wikidata",
      agreement: "geonames",
      "best-score": "wikidata",
      medoid: "tgn",
      densest: "whg",
    },
  },
];

/** The engine's distance scale, in figure units, whatever it is in km for the case. */
export const TAU = 28;
/** Half of it: the radius `densest` counts within. */
const HALF_TAU = TAU / 2;

const distance = (a: FigureRecord, b: FigureRecord) => Math.hypot(a.x - b.x, a.y - b.y);
/** The engine's record quality: the match score times the name form's prior. */
const quality = (record: FigureRecord) => matchScore(record) * (0.5 + 0.5 * record.nameScore);
/** A record's weight in `agreement`'s vote, quality to the power β = 2. */
export const agreementWeight = (record: FigureRecord) => quality(record) ** 2;
/** The same in `place first`: also its gazetteer's point precision squared and its name form's score cubed. */
export const placeWeight = (record: FigureRecord) =>
  agreementWeight(record) * GAZETTEERS[record.id].precision ** 2 * record.nameScore ** 3;
/** The vote `record` gives `candidate`: its weight, falling with distance over τ. */
export const vote = (
  weight: (record: FigureRecord) => number,
  record: FigureRecord,
  candidate: FigureRecord,
) => weight(record) * Math.exp(-distance(candidate, record) / TAU);

/** The size of the part of the plane a figure shows, in figure units; every case is drawn at it. */
const VIEW = { width: 102, height: 46, top: 36 };
/** CSS pixels per figure unit. Text, dots and marks keep their pixel size; positions and radii scale. */
const SCALE = 2.6;
/** The size a place's mark is drawn at, in pixels. */
const SYMBOL = 16;

/** How far a label beside a dot reaches, in figure units: a gazetteer's name at the theme's smallest size. */
const LABEL_REACH = 20;

/** How far a record and the labels beside it reach to either side, in figure units. */
const reachOf = (record: FigureRecord): number[] =>
  [record.nameAt, record.scoreAt].map((offset) =>
    offset?.anchor === "end"
      ? record.x - LABEL_REACH
      : offset?.anchor === "start"
        ? record.x + LABEL_REACH
        : record.x,
  );

/** Where a case's view starts, so its records, labels, marks and areas sit in the middle of the figure. */
const leftOf = (figureCase: FigureCase): number => {
  const xs = [
    ...figureCase.records.flatMap((record) => [record.x, ...reachOf(record)]),
    ...figureCase.marks.map((mark) => mark.x),
    ...figureCase.areas.flatMap((area) => [area.x - area.rx, area.x + area.rx]),
  ];
  return (Math.min(...xs) + Math.max(...xs)) / 2 - VIEW.width / 2;
};

type Overlay = "placeVotes" | "votes" | "scores" | "distances" | "density";

export interface Panel {
  key: GeocodingRepresentative;
  name: string;
  isDefault?: boolean;
  overlay: Overlay;
}

export const PANELS: Panel[] = [
  { key: "place-first", name: "place first", isDefault: true, overlay: "placeVotes" },
  { key: "agreement", name: "agreement", overlay: "votes" },
  { key: "best-score", name: "best score", overlay: "scores" },
  { key: "medoid", name: "medoid", overlay: "distances" },
  { key: "densest", name: "densest", overlay: "density" },
];

/** What each rule does, where it suits and what misleads it, said once below the figures. */
const GUIDE: { key: GeocodingRepresentative; name: string; how: string; good: string; misled: string }[] = [
  {
    key: "place-first",
    name: "place first",
    how:
      "As agreement, but only a record found by the place's own name can win (any record where none " +
      "was); each vote also counts how precisely its gazetteer places records and how likely the " +
      "model judged the name form.",
    good: "a place inside a larger one: a church, a castle, a quarter of a town",
    misled: "a larger unit of the same name matched exactly and placed elsewhere, such as a municipality at its seat; a region whose name its capital shares",
  },
  {
    key: "agreement",
    name: "agreement",
    how:
      "Every gazetteer votes for every record with its best record for that spot, the stronger the " +
      "better matched and the closer; the most votes win.",
    good: "a place most gazetteers know and match well",
    misled: "a larger place around the one searched; a same-named unit matched better nearby",
  },
  {
    key: "best-score",
    name: "best score",
    how:
      "The record with the highest match score, wherever it lies. A score says how well the name " +
      "matched, not where the place is.",
    good: "one exact match among loose ones",
    misled:
      "a wrong record matched exactly; equal top scores, common between TGN and Wikidata, which go " +
      "to TGN's record, often a rounded point",
  },
  {
    key: "medoid",
    name: "medoid",
    how: "Each gazetteer's best record only; the one with the smallest total distance to the others.",
    good: "an area — a region, a diocese, a lake — where the middle is the answer",
    misled: "a crowd of loose matches elsewhere, as it ignores how well records match",
  },
  {
    key: "densest",
    name: "densest",
    how:
      "Each gazetteer's best record only; the one with the most others within half of τ. Counts " +
      "often tie, and a tie goes to the best-scored record.",
    good: "a crowd of records at the place itself, with better-matched ones of a same-named unit nearby",
    misled: "a crowd of loose matches elsewhere; an area, where it falls back on the best score",
  },
];

/** Whether a record takes part in what a figure shows; the rest are drawn faded. */
const takesPart = (panel: Panel, record: FigureRecord, chosen: FigureRecord): boolean =>
  panel.overlay === "density" ? distance(chosen, record) <= HALF_TAU : true;

const formatScore = (score: number) => score.toFixed(2).replace(/^0/, "");

const RuleFigure: React.FC<{ figureCase: FigureCase; panel: Panel; says: string }> = ({
  figureCase,
  panel,
  says,
}) => {
  const theme = useTheme();
  const { records } = figureCase;
  const left = leftOf(figureCase);
  /** A point of the plane in the figure's own pixels. */
  const at = (x: number, y: number) => ({ x: (x - left) * SCALE, y: (y - VIEW.top) * SCALE });
  const chosen = records.find((record) => record.id === figureCase.picks[panel.key])!;
  const chosenAt = at(chosen.x, chosen.y);
  const width = VIEW.width * SCALE;
  const height = VIEW.height * SCALE;
  const weight = panel.overlay === "placeVotes" ? placeWeight : agreementWeight;
  const voters =
    panel.overlay === "votes" || panel.overlay === "placeVotes"
      ? records.filter((record) => record !== chosen)
      : [];
  const strongest = Math.max(...voters.map((record) => vote(weight, record, chosen)), 0);
  const best = Math.max(...records.map(matchScore));
  const scale = (figureCase.scaleKm / figureCase.tauKm) * TAU * SCALE;
  const nameAt = chosen.nameAt ?? BELOW;

  return (
    <StyledRuleFigure
      role="img"
      aria-label={`${panel.name}: chooses the ${chosen.id} record, ${says}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      {figureCase.areas.map((area, index) => (
        <StyledArea
          key={`area-${index}`}
          cx={at(area.x, area.y).x}
          cy={at(area.x, area.y).y}
          rx={area.rx * SCALE}
          ry={area.ry * SCALE}
        />
      ))}
      <StyledMapSymbol>
        {figureCase.marks.map(({ icon: Icon, x, y, label }) => (
          <Icon
            key={label}
            x={at(x, y).x - SYMBOL / 2}
            y={at(x, y).y - SYMBOL / 2}
            width={SYMBOL}
            height={SYMBOL}
          />
        ))}
      </StyledMapSymbol>
      <StyledScaleBar>
        <path d={`M ${width - 10 - scale} ${height - 8} v 3 h ${scale} v -3`} />
        <StyledFigureLabel x={width - 10 - scale / 2} y={height - 11} textAnchor="middle">
          {figureCase.scaleKm} km
        </StyledFigureLabel>
      </StyledScaleBar>

      {voters.map((record) => (
        <StyledVoteLine
          key={`vote-${record.id}`}
          x1={at(record.x, record.y).x}
          y1={at(record.x, record.y).y}
          x2={chosenAt.x}
          y2={chosenAt.y}
          strokeWidth={0.5 + (5 * vote(weight, record, chosen)) / strongest}
          $color={sourceColor(theme, record.id)}
        />
      ))}
      {panel.overlay === "distances"
        ? records
            .filter((record) => record !== chosen)
            .map((record) => (
              <StyledDistanceLine
                key={`line-${record.id}`}
                x1={chosenAt.x}
                y1={chosenAt.y}
                x2={at(record.x, record.y).x}
                y2={at(record.x, record.y).y}
              />
            ))
        : null}
      {panel.overlay === "density" ? (
        <StyledRadius cx={chosenAt.x} cy={chosenAt.y} r={HALF_TAU * SCALE} />
      ) : null}

      {records.map((record) => (
        <StyledRecordDot
          key={record.id}
          cx={at(record.x, record.y).x}
          cy={at(record.x, record.y).y}
          r={4}
          $color={sourceColor(theme, record.id)}
          $around={!!record.around}
          $faded={!takesPart(panel, record, chosen)}
        />
      ))}
      {panel.overlay === "scores"
        ? records.map((record) => {
            const offset = record.scoreAt ?? ABOVE;
            return (
              <StyledFigureScore
                key={`score-${record.id}`}
                x={at(record.x, record.y).x + offset.dx}
                y={at(record.x, record.y).y + offset.dy}
                textAnchor={offset.anchor}
                $best={matchScore(record) === best}
              >
                {formatScore(matchScore(record))}
              </StyledFigureScore>
            );
          })
        : null}
      <StyledChosenRing cx={chosenAt.x} cy={chosenAt.y} r={8} />
      {panel.overlay === "scores" ? null : (
        <StyledFigureName
          x={chosenAt.x + nameAt.dx}
          y={chosenAt.y + nameAt.dy}
          textAnchor={nameAt.anchor}
          $color={sourceColor(theme, chosen.id)}
        >
          {chosen.id}
        </StyledFigureName>
      )}
    </StyledRuleFigure>
  );
};

/** What a figure's pick comes to: whether its rule found the place searched. */
const verdictOf = (figureCase: FigureCase, panel: Panel) => {
  const chosen = figureCase.records.find((record) => record.id === figureCase.picks[panel.key])!;
  const found = figureCase.right.includes(chosen.id);
  return { found, text: found ? chosen.place : `${chosen.place}, not the place searched` };
};

/** A legend's sample, drawn with the figures' own shapes. */
const Swatch: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <StyledLegendSwatch width={18} height={18} viewBox="-9 -9 18 18" aria-hidden>
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
  const [caseKey, setCaseKey] = useState<FigureCase["key"]>("church");
  const figureCase = CASES.find((one) => one.key === caseKey)!;

  return (
    <StyledRules>
      <StyledRulesIntro>
        A suggestion groups the records lying within 2.5 times τ of the group&apos;s centre, τ being
        the engine&apos;s distance scale for the gazetteer location type (3 km for a church, 10 km
        for a settlement, 60 km for a region). Its coordinate is always one of those records, never
        an average, and the rule decides which. Every rule but best score passes over the
        model&apos;s own guess (llm-coords). No rule suits every place: switch between the cases to
        see where each finds the place and where it is misled. On the engine&apos;s own test cases
        agreement found the place in 79 of 100, medoid 75, densest 71 and best score 67; place
        first took agreement&apos;s 79 to 84.
      </StyledRulesIntro>
      <StyledCaseSwitch role="group" aria-label="cases">
        {CASES.map((one) => (
          <StyledCaseButton
            key={one.key}
            type="button"
            aria-pressed={one.key === caseKey}
            $current={one.key === caseKey}
            onClick={() => setCaseKey(one.key)}
          >
            {one.label}
          </StyledCaseButton>
        ))}
      </StyledCaseSwitch>
      <StyledCaseStory>{figureCase.story}</StyledCaseStory>
      <StyledRulesLegend>
        <StyledRulesLegendItem>
          <Swatch>
            <StyledRecordDot cx={0} cy={0} r={4} $color={sample} $around={false} $faded={false} />
          </Swatch>
          found by the place&apos;s own name
        </StyledRulesLegendItem>
        {figureCase.records.some((record) => record.around) ? (
          <StyledRulesLegendItem>
            <Swatch>
              <StyledRecordDot cx={0} cy={0} r={4} $color={sample} $around $faded={false} />
            </Swatch>
            by the name of a place around it
          </StyledRulesLegendItem>
        ) : null}
        <StyledRulesLegendItem>
          <Swatch>
            <StyledRecordDot cx={0} cy={0} r={4} $color={sample} $around={false} $faded={false} />
            <StyledChosenRing cx={0} cy={0} r={8} />
          </Swatch>
          chosen
        </StyledRulesLegendItem>
        {figureCase.marks.map(({ icon: Icon, label }) => (
          <StyledRulesLegendItem key={label}>
            <StyledMapSymbol as="span">
              <Icon />
            </StyledMapSymbol>
            {label}
          </StyledRulesLegendItem>
        ))}
        <StyledRulesLegendItem>
          {figureCase.records.map((record) => (
            <GazetteerTag key={record.id} source={record.id} />
          ))}
        </StyledRulesLegendItem>
      </StyledRulesLegend>
      <StyledRulesLegend>
        <StyledRulesLegendItem>
          coloured lines: the votes the record chosen got, thicker for a stronger one
        </StyledRulesLegendItem>
        <StyledRulesLegendItem>grey lines: the distances medoid adds up</StyledRulesLegendItem>
        <StyledRulesLegendItem>dashed circle: half of τ, the radius densest counts within</StyledRulesLegendItem>
        <StyledRulesLegendItem>faded: not counted</StyledRulesLegendItem>
        <StyledRulesLegendItem>bold: the highest score</StyledRulesLegendItem>
      </StyledRulesLegend>
      <StyledRulesGrid>
        {PANELS.map((panel) => {
          const verdict = verdictOf(figureCase, panel);
          return (
            <StyledRule key={panel.key} $selected={panel.key === selected}>
              <StyledRuleName>
                {panel.name}
                {panel.isDefault ? <StyledRuleDefault>default</StyledRuleDefault> : null}
                {panel.key === selected ? <StyledRuleDefault>chosen here</StyledRuleDefault> : null}
              </StyledRuleName>
              <RuleFigure figureCase={figureCase} panel={panel} says={verdict.text} />
              <StyledVerdict $found={verdict.found}>
                {verdict.found ? "✓ " : "✗ "}
                {verdict.text}
              </StyledVerdict>
            </StyledRule>
          );
        })}
      </StyledRulesGrid>
      <StyledGuide>
        <StyledGuideHead>rule</StyledGuideHead>
        <StyledGuideHead>picks</StyledGuideHead>
        <StyledGuideHead>good for</StyledGuideHead>
        <StyledGuideHead>misled by</StyledGuideHead>
        {GUIDE.map((rule) => (
          <React.Fragment key={rule.key}>
            <StyledGuideRule>{rule.name}</StyledGuideRule>
            <StyledGuideCell>{rule.how}</StyledGuideCell>
            <StyledGuideCell data-label="good for: ">{rule.good}</StyledGuideCell>
            <StyledGuideCell data-label="misled by: ">{rule.misled}</StyledGuideCell>
          </React.Fragment>
        ))}
      </StyledGuide>
    </StyledRules>
  );
};
