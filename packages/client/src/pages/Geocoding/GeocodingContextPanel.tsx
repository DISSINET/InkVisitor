import { DEFAULT_CONTEXT_WEIGHTS, IGeocodingContext } from "@inkvisitor/shared/types/geocoding";
import { useQuery } from "@tanstack/react-query";
import { Button } from "components";
import Dropdown from "components/advanced";
import { IcoChevronDown, IcoGeocode } from "Theme/icons";
import React, { useState } from "react";
import { engineParameters } from "./engine";
import {
  CUSTOM_REGION,
  QUERY_FIELDS,
  QueryField,
  SingleQueryField,
  UNSET,
  contextLanguages,
  contextMultiOptions,
  contextOptions,
  NEUTRAL_STEP,
  WEIGHT_STEPS,
  contextWeight,
  isWeightDefault,
  stepToWeight,
  weightToStep,
  optionLabel,
  optionLabels,
  queryFieldLabel,
  queryFieldWeightNote,
  regionOptions,
  regionValue,
} from "./geocodingContextFields";
import {
  StyledContextCaret,
  StyledContextGlobal,
  StyledContextGrid,
  StyledContextHead,
  StyledContextLabel,
  StyledContextNote,
  StyledContextPanel,
  StyledContextRerun,
  StyledContextRerunNote,
  StyledContextReset,
  StyledContextSeparator,
  StyledContextSummary,
  StyledContextSummaryPart,
  StyledContextTitle,
  StyledContextToggle,
  StyledWeightCell,
  StyledWeightSlider,
  StyledWeightValue,
} from "./GeocodingContextPanelStyles";

/**
 * The query context, on screen and editable.
 *
 * These four fields decide which gazetteers the engine asks and how harshly it
 * judges what they return, so they are the question rather than a preference.
 * Behind a modal they were unreadable at the moment they matter — beside a
 * wrong answer — and the panel is where that answer is.
 *
 * Each field carries its own weight beside it, because the engine scores a
 * source's relevance as a weighted mean over exactly these four dimensions. A
 * weight is not a second setting about the field: it is how much that field's
 * answer counts, and it belongs where the answer is given. Region starts at
 * double the rest — it is the only dimension measured from a source's own
 * records rather than declared by the source about itself.
 *
 * These are the researcher's own defaults, saved as they are chosen. Each field
 * falls back to what the project's owner set, and a field carrying a personal
 * value names the project's underneath it — so what was overridden, and with
 * what, is readable without opening anything. Clearing a field drops the
 * personal value rather than blanking the question: the layering reads an empty
 * personal field as "nothing said here", which is what lets the project's answer
 * through.
 *
 * Folded away, the whole question stays on one line and the offer to ask again
 * stays reachable — a fold that hid either would cost a press at exactly the
 * moment the panel is worth having.
 */

/** Whether the fields are folded away. One researcher's habit, not a setting. */
const OPEN_KEY = "geocoding:contextPanelOpen";

/**
 * Whether this researcher has ever changed a field here.
 *
 * The note under the heading is instruction: it earns its two permanent lines
 * once, for someone meeting the panel, and never again. Changing a field is the
 * proof that it landed, so that is what retires it — the text stays reachable
 * on the heading afterwards.
 */
const USED_KEY = "geocoding:contextPanelUsed";

const NOTE =
  "Sent with every request, and saved as your own defaults. The engine uses these to choose " +
  "which gazetteers to ask and to judge how well a result fits; a field you clear falls back " +
  "to the project's. The slider beside each one says how much it counts.";



interface GeocodingContextPanel {
  /** The context every request from this page is sent with. */
  context: IGeocodingContext;
  /** What each field holds with no personal value on it. */
  projectContext: IGeocodingContext;
  onChange: (field: SingleQueryField, value: string) => void;
  /** The languages the name is stated to be in. Several are normal. */
  onLanguagesChange: (values: string[]) => void;
  /** How much one dimension counts, over the engine's own default. */
  onWeightChange: (field: QueryField, weight: number) => void;
  /** Drops every personal value, returning the fields and weights to the project's. */
  onReset: () => void;
  /**
   * Offered only while the suggestions on screen were found under a different
   * question. Absent when there is nothing to ask again about — no Location, no
   * answer, or an answer that still matches what the fields say.
   */
  onRegeocode?: () => void;
}

export const GeocodingContextPanel: React.FC<GeocodingContextPanel> = ({
  context,
  projectContext,
  onChange,
  onLanguagesChange,
  onWeightChange,
  onReset,
  onRegeocode,
}) => {
  const [open, setOpen] = useState(() => localStorage.getItem(OPEN_KEY) !== "no");
  const [used, setUsed] = useState(() => localStorage.getItem(USED_KEY) === "yes");

  /** Every edit goes through here, because the first one retires the note. */
  const noteRetired = () => {
    localStorage.setItem(USED_KEY, "yes");
    setUsed(true);
  };
  const change = (field: SingleQueryField, value: string) => {
    noteRetired();
    onChange(field, value);
  };

  const toggle = () =>
    setOpen((current) => {
      localStorage.setItem(OPEN_KEY, current ? "no" : "yes");
      return !current;
    });

  // the engine owns these vocabularies; the same query key the context modal
  // uses, so opening either costs one request between them
  const { data: parameters } = useQuery({
    queryKey: ["geocoding-parameters"],
    queryFn: ({ signal }) => engineParameters(signal),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });

  const languages = contextLanguages(context);

  /**
   * Whether this field departs from an answer the project already gave.
   *
   * A project that sets nothing for a field is not being overridden by one that
   * carries a value — it is simply silent, and saying "project default: —" on
   * every row would be four lines of nothing to go back to.
   */
  const overridden = (field: QueryField) => {
    if (field === "language") {
      const theirs = contextLanguages(projectContext);
      return theirs.length > 0 && theirs.join(",") !== languages.join(",");
    }
    if (field === "region" && context.regionBbox) {
      // a drawn box replaces whatever region the project named, and replaces
      // "no region" with an area, which is a departure either way
      return true;
    }
    return !!projectContext[field] && (context[field] || UNSET) !== projectContext[field];
  };
  const anyOverridden =
    QUERY_FIELDS.some(overridden) ||
    QUERY_FIELDS.some(
      (field) => contextWeight(context, field) !== contextWeight(projectContext, field),
    );

  /**
   * Whether this row's departure is a drawn region and nothing behind it.
   *
   * The one case where the field departs from the project without there being
   * a project answer to return to: the box replaced an absence.
   */
  const drawnOverNothing = (field: QueryField) =>
    field === "region" && !!context.regionBbox && !projectContext.region;

  /** What the folded line says one field holds. */
  const summaryOf = (field: QueryField): string => {
    if (field === "language") {
      return optionLabels(parameters, field, languages);
    }
    if (field === "region" && context.regionBbox) {
      return "custom region";
    }
    return optionLabel(parameters, field, context[field]);
  };

  /**
   * The slider that says how much this dimension counts.
   *
   * Drawn on every row rather than only where it has been moved: the weights
   * are what turns four answers into one relevance number, and a control that
   * appeared once it had been used would be a mechanism nobody could find.
   */
  const weightCell = (field: QueryField) => {
    const weight = contextWeight(context, field);
    const step = weightToStep(weight, field);
    const moved = !isWeightDefault(weight, field);
    const note =
      `${queryFieldWeightNote[field]} The middle of the slider is what the engine does ` +
      `unasked, which for this one is ${DEFAULT_CONTEXT_WEIGHTS[field]}; the top is double that.`;
    return (
      <StyledWeightCell title={note}>
        <StyledWeightSlider
          type="range"
          min={0}
          max={WEIGHT_STEPS}
          step={1}
          value={step}
          aria-label={`how much ${queryFieldLabel[field]} counts`}
          aria-valuetext={step === 0 ? "off" : step === NEUTRAL_STEP ? "normal" : String(step)}
          $moved={moved}
          onChange={(event) => {
            noteRetired();
            onWeightChange(field, stepToWeight(Number(event.target.value), field));
          }}
        />
        {/* the position on the shared scale rather than the number the engine
            is sent: the four dimensions do not share a default, so the sent
            numbers do not line up into a column that can be read down. The
            number itself is on the tooltip, where it is wanted once */}
        <StyledWeightValue $moved={moved} $off={weight === 0}>
          {weight === 0 ? "off" : step === NEUTRAL_STEP ? "normal" : String(step)}
        </StyledWeightValue>
      </StyledWeightCell>
    );
  };

  /** The control this field is answered with. Only language holds a list. */
  const fieldControl = (field: QueryField) => {
    if (field === "language") {
      return (
        <Dropdown.Multi.Basic
          width="full"
          options={contextMultiOptions(parameters, field, languages)}
          value={languages}
          placeholder="—"
          onChange={(values) => {
            noteRetired();
            onLanguagesChange(values);
          }}
        />
      );
    }
    if (field === "region") {
      return (
        <Dropdown.Single.Basic
          width="full"
          options={regionOptions(parameters, context)}
          value={regionValue(context)}
          onChange={(value) => {
            // the drawn entry is where the picker already is whenever it is
            // offered at all, so choosing it asks for nothing; every other
            // choice is a named region, which replaces the box
            if ((value as string) === CUSTOM_REGION) {
              return;
            }
            change(field, (value as string) || UNSET);
          }}
        />
      );
    }
    return (
      <Dropdown.Single.Basic
        width="full"
        options={contextOptions(parameters, field, context[field])}
        value={context[field] ?? UNSET}
        onChange={(value) => change(field, (value as string) || UNSET)}
      />
    );
  };

  return (
    <StyledContextPanel>
      <StyledContextHead>
        <StyledContextToggle
          type="button"
          aria-expanded={open}
          title={open ? "fold the query context away" : "show the query context"}
          onClick={toggle}
        >
          <StyledContextCaret $open={open}>
            <IcoChevronDown />
          </StyledContextCaret>
          <StyledContextTitle title={NOTE}>query context</StyledContextTitle>
          {open ? null : (
            <StyledContextSummary>
              {QUERY_FIELDS.map((field, index) => (
                <React.Fragment key={field}>
                  {index ? <StyledContextSeparator>·</StyledContextSeparator> : null}
                  <StyledContextSummaryPart
                    $set={field === "language" ? languages.length > 0 : !!context[field] || (field === "region" && !!context.regionBbox)}
                    $overridden={overridden(field)}
                    title={queryFieldLabel[field]}
                  >
                    {summaryOf(field)}
                  </StyledContextSummaryPart>
                </React.Fragment>
              ))}
            </StyledContextSummary>
          )}
        </StyledContextToggle>
        {open && anyOverridden ? (
          <StyledContextReset type="button" onClick={onReset}>
            use the project&apos;s defaults
          </StyledContextReset>
        ) : null}
        {/* folded, the offer to ask again has nowhere else to be — and it is the
            one thing on the panel that goes stale while nobody is looking */}
        {!open && onRegeocode ? (
          <Button label="regeocode" icon={<IcoGeocode />} color="success" onClick={onRegeocode} />
        ) : null}
      </StyledContextHead>

      {!open ? null : (
        <>
        {used && parameters ? null : (
          <StyledContextNote>
            {used ? "" : NOTE}
            {parameters ? "" : " The engine is unreachable, so its vocabularies cannot be listed."}
          </StyledContextNote>
        )}

        <StyledContextGrid>
          {QUERY_FIELDS.map((field) => (
            <React.Fragment key={field}>
              <StyledContextLabel $overridden={overridden(field)}>
                {queryFieldLabel[field]}
              </StyledContextLabel>
              {fieldControl(field)}
              {weightCell(field)}
              {overridden(field) ? (
                <StyledContextGlobal
                  type="button"
                  title={
                    drawnOverNothing(field)
                      ? "drop the drawn region, leaving the query with no region at all"
                      : `use the project's ${queryFieldLabel[field]} instead of your own`
                  }
                  onClick={() =>
                    field === "language" ? onLanguagesChange([]) : change(field, UNSET)
                  }
                >
                  {/* a drawn region over a project that names none is not
                      overriding an answer — there is nothing to go back to but
                      the absence, and "project default: —" would name it as
                      though it were a value */}
                  {drawnOverNothing(field)
                    ? "drop the drawn region"
                    : `project default: ${
                        field === "language"
                          ? optionLabels(parameters, field, contextLanguages(projectContext))
                          : optionLabel(parameters, field, projectContext[field])
                      }`}
                </StyledContextGlobal>
              ) : null}
            </React.Fragment>
          ))}
        </StyledContextGrid>

        {onRegeocode ? (
          <StyledContextRerun>
            <Button
              label="regeocode"
              icon={<IcoGeocode />}
              color="success"
              onClick={onRegeocode}
            />
            <StyledContextRerunNote>
              the suggestions below were found under a different context
            </StyledContextRerunNote>
          </StyledContextRerun>
        ) : null}
        </>
      )}
    </StyledContextPanel>
  );
};
