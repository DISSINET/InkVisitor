import { GeocodingRepresentative } from "@inkvisitor/shared/types/geocoding";
import React, { useId, useState } from "react";
import { useTheme } from "styled-components";
import {
  IcoChevronDown,
  IcoPlaceArchaeological,
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
  StyledCaseFit,
  StyledCaseStory,
  StyledCaseSwitch,
  StyledChosenRing,
  StyledFigureLabel,
  StyledGuide,
  StyledGuideQuestion,
  StyledHow,
  StyledHowList,
  StyledHowRule,
  StyledHowToggle,
  StyledLegendSwatch,
  StyledMapSymbol,
  StyledRecordDot,
  StyledRule,
  StyledRuleDefault,
  StyledRuleFigure,
  StyledRuleName,
  StyledRulesGrid,
  StyledRulesLegend,
  StyledRulesLegendItem,
  StyledScaleBar,
  StyledTable,
  StyledTableCaption,
  StyledVerdict,
} from "./RepresentativeRulesStyles";

/**
 * A guide to the rule for a suggestion's coordinate, from what a project
 * geocodes: four cases to switch between, each drawn once per rule as one
 * suggestion with the record that rule picks, and a table of when to choose each
 * rule and when not, naming the cases. How the rules pick sits in a footnote,
 * closed.
 *
 * Each case is one suggestion: choosing between suggestions is the researcher's,
 * not a rule's. Every record's match type, confidence and name-form score are the
 * facts hga-engine 0.8.0 picks by; the test of `CitingSettings` works every pick
 * out again from them with the engine's definitions, so moving a record that
 * changes a pick fails it.
 */

export type RecordId = "wikidata" | "whg" | "pleiades" | "tgn" | "geonames" | "nominatim";

export type MatchType = "exact" | "alias" | "fuzzy";

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
}

interface PlaceMark {
  /** A place mark; sized by `size`, as react-icons draws at 1em whatever width it is given. */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number | string }>;
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
  key: "buildings" | "towns" | "regions" | "deserted";
  /** The switch's label: what a project geocodes, as the guide's table names it too. */
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

export const CASES: FigureCase[] = [
  {
    key: "buildings",
    label: "buildings in towns",
    story:
      "A church on the edge of a town, searched by its own name. Wikidata, by an alternative " +
      "name, and WHG place the church; three gazetteers place the town around it, found by the " +
      "town's name.",
    tauKm: 3,
    scaleKm: 1,
    records: [
      { id: "wikidata", x: 100, y: 66, match: "alias", nameScore: 0.9, place: "the church" },
      { id: "whg", x: 106, y: 61, match: "exact", nameScore: 0.9, place: "the church" },
      { id: "tgn", x: 128, y: 70, match: "exact", nameScore: 0.6, around: true, place: "the town" },
      { id: "geonames", x: 134, y: 66, match: "exact", nameScore: 0.6, around: true, place: "the town" },
      { id: "nominatim", x: 140, y: 71, match: "exact", confidence: 0.7, nameScore: 0.6, around: true, place: "the town" },
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
    key: "towns",
    label: "towns and villages",
    story:
      "A town searched by its name. Four gazetteers place the town; TGN matches the name as " +
      "well as Wikidata does, but its point is a former province's of the same name, a dozen " +
      "km off.",
    tauKm: 10,
    scaleKm: 5,
    records: [
      { id: "wikidata", x: 100, y: 62, match: "exact", nameScore: 0.9, place: "the town" },
      { id: "geonames", x: 105, y: 65, match: "exact", nameScore: 0.9, place: "the town" },
      { id: "whg", x: 99, y: 67, match: "exact", nameScore: 0.9, place: "the town" },
      { id: "nominatim", x: 104, y: 59, match: "exact", confidence: 0.7, nameScore: 0.9, place: "the town" },
      { id: "tgn", x: 136, y: 55, match: "exact", nameScore: 0.9, place: "a former province's point" },
    ],
    right: ["wikidata", "geonames", "whg", "nominatim"],
    marks: [
      { icon: IcoPlaceSettlement, x: 92, y: 56, label: "the town searched for" },
      { icon: IcoPlaceRegion, x: 144, y: 49, label: "a former province of the same name" },
    ],
    areas: [{ x: 102, y: 63, rx: 9, ry: 7 }],
    picks: {
      "place-first": "wikidata",
      agreement: "wikidata",
      "best-score": "tgn",
      medoid: "geonames",
      densest: "wikidata",
    },
  },
  {
    key: "regions",
    label: "regions named after a town",
    story:
      "A duchy named after its capital, searched by that name. Two gazetteers place the duchy at " +
      "its middle; two place the capital city on its western edge; two place towns of similar " +
      "names on its eastern edge.",
    tauKm: 60,
    scaleKm: 30,
    records: [
      { id: "tgn", x: 98, y: 64, match: "exact", nameScore: 0.9, place: "the capital" },
      { id: "whg", x: 102, y: 60, match: "exact", nameScore: 0.9, place: "the capital" },
      { id: "wikidata", x: 131, y: 58, match: "alias", nameScore: 0.7, place: "the duchy's middle" },
      { id: "geonames", x: 137, y: 63, match: "exact", nameScore: 0.7, place: "the duchy's middle" },
      { id: "pleiades", x: 163, y: 55, match: "alias", nameScore: 0.5, place: "a town of a similar name" },
      { id: "nominatim", x: 166, y: 61, match: "fuzzy", confidence: 0.6, nameScore: 0.6, place: "a town of a similar name" },
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
    key: "deserted",
    label: "deserted villages",
    story:
      "A village deserted centuries ago, searched by its name in the sources. Four gazetteers " +
      "place its site under older spellings; Wikidata and GeoNames match the modern spelling, " +
      "which a living village nearby carries.",
    tauKm: 10,
    scaleKm: 5,
    records: [
      { id: "wikidata", x: 100, y: 58, match: "exact", nameScore: 0.9, place: "the living village" },
      { id: "geonames", x: 104, y: 62, match: "exact", nameScore: 0.9, place: "the living village" },
      { id: "tgn", x: 121, y: 64, match: "alias", nameScore: 0.5, place: "the deserted village" },
      { id: "whg", x: 126, y: 60, match: "exact", nameScore: 0.5, place: "the deserted village" },
      { id: "nominatim", x: 131, y: 64, match: "exact", confidence: 0.6, nameScore: 0.5, place: "the deserted village" },
      { id: "pleiades", x: 126, y: 68, match: "alias", nameScore: 0.5, place: "the deserted village" },
    ],
    right: ["tgn", "whg", "nominatim", "pleiades"],
    marks: [
      { icon: IcoPlaceArchaeological, x: 137, y: 56, label: "the deserted village searched for" },
      { icon: IcoPlaceHouse, x: 94, y: 51, label: "a living village with its modern name" },
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

/** The size of the part of the plane a figure shows, in figure units; every case is drawn at it. */
const VIEW = { width: 102, height: 46, top: 36 };
/** CSS pixels per figure unit: five figures to a row in the settings window. Dots and marks keep their pixel size. */
const SCALE = 2.1;
/** The size a place's mark is drawn at, in pixels. */
const SYMBOL = 14;

/** Where a case's view starts, so its records, marks and areas sit in the middle of the figure. */
const leftOf = (figureCase: FigureCase): number => {
  const xs = [
    ...figureCase.records.map((record) => record.x),
    ...figureCase.marks.map((mark) => mark.x),
    ...figureCase.areas.flatMap((area) => [area.x - area.rx, area.x + area.rx]),
  ];
  return (Math.min(...xs) + Math.max(...xs)) / 2 - VIEW.width / 2;
};

/**
 * One rule the engine takes, as the settings name and describe it and the guide
 * draws and recommends it: the one list each of those reads.
 */
export interface Panel {
  key: GeocodingRepresentative;
  name: string;
  isDefault?: boolean;
  /** What it picks, in a sentence, beside the choice. */
  summary: string;
  /** How it picks, for the guide's footnote. */
  how: string;
  /** How often it found the place in the engine's tests, as the table's caption explains. */
  found: string;
  /** The projects it suits: names the label of every case whose place it finds. */
  choose: string;
  /** The projects it misleads: names the label of every case whose place it misses. */
  avoid: string;
}

export const PANELS: Panel[] = [
  {
    key: "place-first",
    name: "place first",
    isDefault: true,
    summary:
      "The record most gazetteers agree on, among those found by the place's own name rather " +
      "than by a larger place around it.",
    how:
      "As agreement, but only a record found by the place's own name can win (any record where none " +
      "was); each vote also counts how precisely its gazetteer places records and how likely the " +
      "model judged the name form.",
    found: "79 + 2–3",
    choose:
      "buildings in towns (churches, monasteries, castles); towns and villages; a project " +
      "geocoding many sorts of place",
    avoid: "regions named after a town; deserted villages",
  },
  {
    key: "agreement",
    name: "agreement",
    summary: "The record most gazetteers agree on, the better matched counting for more.",
    how:
      "Every gazetteer votes for every record with its best record for that spot, the stronger the " +
      "better matched and the closer; the most votes win.",
    found: "79",
    choose:
      "towns and villages; fortresses and battlefields, where the engine's tests found place " +
      "first no better",
    avoid: "buildings in towns; regions named after a town; deserted villages",
  },
  {
    key: "best-score",
    name: "best score",
    summary: "The record whose name matched best, wherever it lies.",
    how:
      "The record with the highest match score, wherever it lies. A score says how well the name " +
      "matched, not where the place is. TGN and Wikidata often score the same, and the engine " +
      "settles that tie for TGN, whose point is often rounded or a former province's.",
    found: "67",
    choose: "comparison only: it is how the engine chose before version 0.6",
    avoid:
      "buildings in towns; towns and villages; regions named after a town; deserted villages",
  },
  {
    key: "medoid",
    name: "medoid",
    summary: "The record lying in the middle of the others.",
    how: "Each gazetteer's best record only; the one with the smallest total distance to the others.",
    found: "75",
    choose: "towns and villages; regions named after a town; deserted villages",
    avoid: "buildings in towns, where the town's records outnumber the building's",
  },
  {
    key: "densest",
    name: "densest",
    summary: "The record with the most others close by.",
    how:
      "Each gazetteer's best record only; the one with the most others within half of τ. Counts " +
      "often tie, and a tie goes to the best-scored record.",
    found: "71",
    choose: "towns and villages; deserted villages",
    avoid: "buildings in towns; regions named after a town",
  },
];

const RuleFigure: React.FC<{ figureCase: FigureCase; panel: Panel }> = ({ figureCase, panel }) => {
  const theme = useTheme();
  const left = leftOf(figureCase);
  /** A point of the plane in the figure's own pixels. */
  const at = (x: number, y: number) => ({ x: (x - left) * SCALE, y: (y - VIEW.top) * SCALE });
  const chosen = figureCase.records.find((record) => record.id === figureCase.picks[panel.key])!;
  const chosenAt = at(chosen.x, chosen.y);
  const width = VIEW.width * SCALE;
  const height = VIEW.height * SCALE;
  const scale = (figureCase.scaleKm / figureCase.tauKm) * TAU * SCALE;

  return (
    <StyledRuleFigure
      role="img"
      aria-label={`${panel.name}: rings the ${chosen.id} record`}
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
          <Icon key={label} x={at(x, y).x - SYMBOL / 2} y={at(x, y).y - SYMBOL / 2} size={SYMBOL} />
        ))}
      </StyledMapSymbol>
      <StyledScaleBar>
        <path d={`M ${width - 8 - scale} ${height - 6} v 3 h ${scale} v -3`} />
        <StyledFigureLabel x={width - 8 - scale / 2} y={height - 9} textAnchor="middle">
          {figureCase.scaleKm} km
        </StyledFigureLabel>
      </StyledScaleBar>
      {figureCase.records.map((record) => (
        <StyledRecordDot
          key={record.id}
          cx={at(record.x, record.y).x}
          cy={at(record.x, record.y).y}
          r={4}
          $color={sourceColor(theme, record.id)}
          $around={!!record.around}
        />
      ))}
      <StyledChosenRing cx={chosenAt.x} cy={chosenAt.y} r={7.5} />
    </StyledRuleFigure>
  );
};

/** What a figure's pick comes to: whether its rule found the place searched. */
export const verdictOf = (figureCase: FigureCase, panel: Panel) => {
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

/** The rules named in a list, for the case's verdict line. */
const namesOf = (panels: Panel[]) => panels.map((panel) => panel.name).join(", ");

interface RepresentativeRules {
  /** The rule the settings hold, marked among the figures. */
  selected: GeocodingRepresentative;
}

// kept mounted while hidden in a settings window that renders on every key typed,
// and it depends on nothing but the rule chosen
export const RepresentativeRules: React.FC<RepresentativeRules> = React.memo(({ selected }) => {
  const theme = useTheme();
  const sample = theme.color["greyer"];
  const [caseKey, setCaseKey] = useState<FigureCase["key"]>("buildings");
  const [explaining, setExplaining] = useState(false);
  const how = useId();
  const figureCase = CASES.find((one) => one.key === caseKey)!;
  const verdicts = PANELS.map((panel) => ({ panel, ...verdictOf(figureCase, panel) }));
  const suits = verdicts.filter((one) => one.found).map((one) => one.panel);
  const avoid = verdicts.filter((one) => !one.found).map((one) => one.panel);

  return (
    <StyledGuide>
      <StyledGuideQuestion id={`${how}-question`}>
        What does your project geocode most?
      </StyledGuideQuestion>
      <StyledCaseSwitch role="group" aria-labelledby={`${how}-question`}>
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
      <StyledCaseFit>
        <span>
          suits: <strong>{suits.length ? namesOf(suits) : "none"}</strong>
        </span>
        <span>
          avoid: <strong>{avoid.length ? namesOf(avoid) : "none"}</strong>
        </span>
      </StyledCaseFit>
      <StyledRulesLegend>
        <StyledRulesLegendItem>
          <Swatch>
            <StyledRecordDot cx={0} cy={0} r={4} $color={sample} $around={false} />
          </Swatch>
          found by the place&apos;s own name
        </StyledRulesLegendItem>
        {figureCase.records.some((record) => record.around) ? (
          <StyledRulesLegendItem>
            <Swatch>
              <StyledRecordDot cx={0} cy={0} r={4} $color={sample} $around />
            </Swatch>
            by the name of a place around it
          </StyledRulesLegendItem>
        ) : null}
        <StyledRulesLegendItem>
          <Swatch>
            <StyledRecordDot cx={0} cy={0} r={4} $color={sample} $around={false} />
            <StyledChosenRing cx={0} cy={0} r={7.5} />
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
      <StyledRulesGrid>
        {verdicts.map(({ panel, found, text }) => (
          <StyledRule key={panel.key} $selected={panel.key === selected}>
            <StyledRuleName>
              {panel.name}
              {panel.isDefault ? <StyledRuleDefault>default</StyledRuleDefault> : null}
              {panel.key === selected ? <StyledRuleDefault>chosen here</StyledRuleDefault> : null}
            </StyledRuleName>
            <RuleFigure figureCase={figureCase} panel={panel} />
            <StyledVerdict $found={found}>
              {found ? "✓ " : "✗ "}
              {text}
            </StyledVerdict>
          </StyledRule>
        ))}
      </StyledRulesGrid>
      {/* the roles restate the table's own, which a browser drops from rows laid
          out as blocks in a narrow window */}
      <StyledTable role="table">
        <StyledTableCaption>
          Places found: of 100 places in the engine&apos;s first test read, how many each rule
          put the coordinate on. Place first came later and was measured against agreement
          only: 2 to 3 more than agreement&apos;s 79. The cases above show where each rule goes
          wrong; the numbers, how often.
        </StyledTableCaption>
        <thead role="rowgroup">
          <tr role="row">
            <th role="columnheader" scope="col">rule</th>
            <th role="columnheader" scope="col">places found</th>
            <th role="columnheader" scope="col">choose it for</th>
            <th role="columnheader" scope="col">avoid it for</th>
          </tr>
        </thead>
        <tbody role="rowgroup">
          {PANELS.map((rule) => (
            <tr key={rule.key} role="row">
              <th role="rowheader" scope="row">
                {rule.name}
              </th>
              <td role="cell" data-label="places found: ">
                {rule.found}
              </td>
              <td role="cell" data-label="choose it for: ">
                {rule.choose}
              </td>
              <td role="cell" data-label="avoid it for: ">
                {rule.avoid}
              </td>
            </tr>
          ))}
        </tbody>
      </StyledTable>
      <StyledHowToggle
        type="button"
        aria-expanded={explaining}
        aria-controls={how}
        $open={explaining}
        onClick={() => setExplaining((open) => !open)}
      >
        <IcoChevronDown aria-hidden />
        How a suggestion&apos;s coordinate is found
      </StyledHowToggle>
      <StyledHow id={how} hidden={!explaining}>
        <p>
          A suggestion groups the records lying within 2.5 times τ of the group&apos;s centre, τ
          being the engine&apos;s distance scale for the gazetteer location type (3 km for a church,
          10 km for a settlement, 60 km for a region). Its coordinate is always one of those
          records, never an average, and the rule decides which. Every rule but best score passes
          over the model&apos;s own guess (llm-coords).
        </p>
        <StyledHowList>
          {PANELS.map((rule) => (
            <li key={rule.key}>
              <StyledHowRule>{rule.name}</StyledHowRule> {rule.how}
            </li>
          ))}
        </StyledHowList>
      </StyledHow>
    </StyledGuide>
  );
});
