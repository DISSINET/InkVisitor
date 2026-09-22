import {
  GEOCODING_PLACE_TYPES,
  GeocodingAccuracy,
  GeocodingPlaceType,
  IGeocodingContext,
} from "@inkvisitor/shared/types/geocoding";
import { IUserOptions } from "@inkvisitor/shared/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import Dropdown from "components/advanced";
import { IconWithTooltip } from "components";
import { IcoInfo } from "Theme/icons";
import React, { useState } from "react";
import { toast } from "react-toastify";
import {
  StyledFullRow,
  StyledRowInfo,
  StyledRowLabel,
  StyledRowControls,
  StyledSectionHeading,
  StyledSectionNote,
  StyledSettingsGrid,
} from "./GeocodingSettingsModalStyles";
import { GazetteerPicker } from "./GazetteerPicker";
import { QuickStrategy } from "./quickGeocode";

/**
 * How this researcher works, as opposed to what they ask.
 *
 * The question itself — region, period, language, kind of place — is edited in
 * the Suggestions panel, where the answer it produced is on screen; these four
 * are settings about the page rather than about a place, and none of them can
 * make an answer stale.
 *
 * Roles are absent by design. Which Concept means `geo:x` is set for the whole
 * project, because it decides what "geocoded" means — were it overridable here,
 * the same Location would read as geocoded for one person and not for another.
 */

const accuracyOptions = Object.values(GeocodingAccuracy).map((value) => ({
  value,
  label: value,
}));

const taskCategoryOptions = [
  { value: "quick", label: "quick — fastest provider" },
  { value: "quality", label: "quality — best model, slower" },
  { value: "offline", label: "offline — local model only" },
];

const yesNoOptions = [
  { value: "yes", label: "yes" },
  { value: "no", label: "no" },
];

/**
 * Stands for "no kind at all" in a control whose other values are kinds.
 *
 * A dropdown cannot hold null, and an empty string would read as a value not
 * yet chosen rather than as the choice to record nothing.
 */
const NO_DEFAULT_PLACE_TYPE = "none";

const defaultPlaceTypeOptions = [
  { value: NO_DEFAULT_PLACE_TYPE, label: "nothing — leave each one alone" },
  ...GEOCODING_PLACE_TYPES.map((placeType) => ({ value: placeType, label: placeType })),
];

/** The keys this modal owns. The query fields belong to the panel, and writing
 *  the whole context here would put back whatever the panel changed meanwhile. */
const quickStrategyOptions = [
  { value: "clearWinner", label: "clear winner only" },
  { value: "topScore", label: "highest score" },
];

const PREFERENCE_FIELDS = [
  "disabledSources",
  "autoSearch",
  "mapClickAccuracy",
  "recordPlaceType",
  "defaultPlaceType",
  "dedupeDiacritics",
  "quickStrategy",
  "quickTakeOffRegion",
  "taskCategory",
] as const;

interface GeocodingContextModal {
  // only what the write needs; the query hands back a response shape whose
  // bookmarks and options both differ from IUser's
  userId: string;
  context: IGeocodingContext;
  /**
   * The project's own context, for the one field where the two layers union.
   *
   * A gazetteer the project has switched off cannot be switched back on here,
   * and the row has to say so rather than simply refusing to move.
   */
  projectContext: IGeocodingContext;
  onClose: () => void;
}

export const GeocodingContextModal: React.FC<GeocodingContextModal> = ({
  userId,
  context,
  projectContext,
  onClose,
}) => {
  const queryClient = useQueryClient();
  /**
   * The preferences as they will be written, which is this researcher's layer
   * alone.
   *
   * `context` arrives resolved — the project's refusals unioned with the
   * researcher's — and this modal writes the researcher's. Seeded with the
   * project's entries taken back out, so saving does not copy the project's
   * decisions into a personal list where they would outlive the project
   * changing its mind.
   */
  const [draft, setDraft] = useState<IGeocodingContext>(() => ({
    ...context,
    disabledSources: (context.disabledSources ?? []).filter(
      (source) => !(projectContext.disabledSources ?? []).includes(source),
    ),
  }));

  const save = useMutation({
    mutationFn: async () =>
      // only the keys this modal owns. The response user carries a narrower
      // options shape than the stored one, so spreading it would drop the
      // fields it omits - and the store merges nested objects, so a partial
      // leaves every sibling option untouched.
      api.usersUpdate(userId, {
        options: {
          geocoding: {
            context: Object.fromEntries(
              PREFERENCE_FIELDS.map((field) => [field, draft[field]]),
            ),
          },
        } as unknown as IUserOptions,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
      toast.success("Geocoding preferences saved.");
      onClose();
    },
    onError: () => toast.error("Your geocoding preferences could not be saved."),
  });

  /**
   * One preference: what it is called, and what it does.
   *
   * The name is kept to two or three words so the column of them can be read
   * down rather than across — and the sentence that would not fit moves onto a
   * mark beside it, where it is there for the one reading who needs it and out
   * of the way of the five who do not.
   */
  const row = (label: string, explains: string, control: React.ReactNode) => (
    <React.Fragment key={label}>
      <StyledRowLabel>
        {label}
        <StyledRowInfo>
          <IconWithTooltip
            icon={<IcoInfo />}
            tooltipText={explains}
            tooltipPosition="right"
            color="greyer"
          />
        </StyledRowInfo>
      </StyledRowLabel>
      <StyledRowControls>{control}</StyledRowControls>
    </React.Fragment>
  );

  return (
    <Modal showModal onClose={onClose} width="normal">
      <ModalHeader title="My geocoding preferences" onClose={onClose} />
      <ModalContent column>
        <StyledSettingsGrid>
          <StyledSectionHeading>Working preferences</StyledSectionHeading>
          <StyledSectionNote>
            How this page behaves while you work. What the engine is asked — region, period,
            language, kind of place — is edited in the Suggestions panel, beside the answer it
            produced.
          </StyledSectionNote>
          {row(
            "run on select",
            "Asks the engine the moment you select a Location, instead of waiting for the " +
              "geocode button. Off is quieter when you are reading down the list rather " +
              "than working through it.",
            <Dropdown.Single.Basic
              width="full"
              options={yesNoOptions}
              value={draft.autoSearch === false ? "no" : "yes"}
              onChange={(value) => setDraft((d) => ({ ...d, autoSearch: value === "yes" }))}
            />,
          )}
          {row(
            "map click",
            "The accuracy recorded when you set a coordinate by clicking the map. Accepting " +
              "a suggestion asks each time instead, because there the sources say how far " +
              "apart they are.",
            <Dropdown.Single.Basic
              width="full"
              options={accuracyOptions}
              value={draft.mapClickAccuracy ?? GeocodingAccuracy.Approximate}
              onChange={(value) =>
                setDraft((d) => ({ ...d, mapClickAccuracy: value as GeocodingAccuracy }))
              }
            />,
          )}
          <StyledSectionHeading>What is written</StyledSectionHeading>
          <StyledSectionNote>
            What a coordinate carries beside itself, on every path that records one.
          </StyledSectionNote>
          {row(
            "kind of place",
            "Whether writing a coordinate also asks what kind of place it is — settlement, " +
              "fortress, river and so on. Turn it off where the project has no Concepts for " +
              "those kinds, or where nobody is recording them.",
            <Dropdown.Single.Basic
              width="full"
              options={yesNoOptions}
              value={draft.recordPlaceType === false ? "no" : "yes"}
              onChange={(value) => setDraft((d) => ({ ...d, recordPlaceType: value === "yes" }))}
            />,
          )}
          {/* only where the question is switched off: with it on, every write
              already carries an answer chosen for that Location, and a blanket
              one would be a second, contradicting answer */}
          {draft.recordPlaceType === false &&
            row(
              "code all as",
              "With the question above off, this kind is written on every Location instead " +
                "of asking. Right for a corpus that is all of one kind — a register of " +
                "parishes, a list of monasteries. Leave it at nothing to record no kind at all.",
              <Dropdown.Single.Basic
                width="full"
                options={defaultPlaceTypeOptions}
                value={draft.defaultPlaceType ?? NO_DEFAULT_PLACE_TYPE}
                onChange={(value) =>
                  setDraft((d) => ({
                    ...d,
                    defaultPlaceType:
                      value === NO_DEFAULT_PLACE_TYPE ? null : (value as GeocodingPlaceType),
                  }))
                }
              />,
            )}
          <StyledSectionHeading>What the engine searches</StyledSectionHeading>
          <StyledSectionNote>
            How the question is put to the gazetteers. Both of these change which answers come
            back, so a run with either altered is a different query and is not served from the
            cache of the last one.
          </StyledSectionNote>
          {row(
            "fold accents",
            "The engine searches several forms of a name. With this on, two that differ " +
              "only by their accents are searched once instead of twice — Zobten and Zobtén " +
              "become one. Leave it off where the spellings are separately attested: Milicz " +
              "and Milicž may be two records of the place, and folding them throws one away. " +
              "Forms differing only in capitals are always folded either way.",
            <Dropdown.Single.Basic
              width="full"
              options={yesNoOptions}
              value={draft.dedupeDiacritics ? "yes" : "no"}
              onChange={(value) => setDraft((d) => ({ ...d, dedupeDiacritics: value === "yes" }))}
            />,
          )}
          {row(
            "model",
            "Which language model the engine may use when it works out which names to " +
              "search for. Quick answers a single place soonest; quality reads the context " +
              "harder and takes longer; offline never leaves the machine it runs on.",
            <Dropdown.Single.Basic
              width="full"
              options={taskCategoryOptions}
              value={draft.taskCategory ?? "quick"}
              onChange={(value) =>
                setDraft((d) => ({
                  ...d,
                  taskCategory: value as IGeocodingContext["taskCategory"],
                }))
              }
            />,
          )}

          <StyledFullRow>
            <StyledSectionHeading>Which gazetteers your runs ask</StyledSectionHeading>
          </StyledFullRow>
          <StyledFullRow>
            <StyledSectionNote>
              A source switched off here is never asked on your own runs — it costs nothing and
              returns nothing. The figures say what the engine measured of each source&apos;s own
              records, which is what the region half of every score it contributes is computed
              from. Sources the project has switched off are held down: an owner sets those.
            </StyledSectionNote>
          </StyledFullRow>
          <StyledFullRow>
            <GazetteerPicker
              // the personal layer alone, because that is what this modal writes;
              // the project's is passed beside it so a row it has already
              // settled can say so instead of quietly refusing to move
              disabled={draft.disabledSources ?? []}
              lockedOff={projectContext.disabledSources ?? []}
              onChange={(disabledSources) => setDraft((d) => ({ ...d, disabledSources }))}
            />
          </StyledFullRow>

          <StyledSectionHeading>Geocoding without reading the run</StyledSectionHeading>
          <StyledSectionNote>
            What the bolt on a row, and the geocode over a marked set, are allowed to accept
            when nobody is reading the answer. Neither ever replaces a coordinate that is
            already recorded.
          </StyledSectionNote>
          {row(
            "quick geocode",
            "What a geocode that asks nobody may accept. The quick action on a row, and the " +
              "one over a marked set, run the engine and write the answer without a person " +
              "reading it — so this says how sure the engine has to be first. " +
              "\u0022Clear winner only\u0022 writes nothing where two answers are close, and " +
              "reports those as skipped for you to work through by hand; " +
              "\u0022highest score\u0022 writes the engine's first answer every time. " +
              "Neither ever replaces a coordinate that is already recorded.",
            <Dropdown.Single.Basic
              width="full"
              options={quickStrategyOptions}
              value={draft.quickStrategy ?? "clearWinner"}
              onChange={(value) =>
                setDraft((d) => ({ ...d, quickStrategy: value as QuickStrategy }))
              }
            />,
          )}
          {row(
            "off-region",
            "The engine marks an answer that falls outside the region above and pushes it " +
              "down the list, rather than hiding it — a corpus does cross its own borders, " +
              "and a person weighing one of these has the region on screen. A quick geocode " +
              "does not, so it refuses them by default however far ahead they score: how well " +
              "the sources agree about a name says nothing about whether the place they agree " +
              "on belongs in this corpus. Turn this on for material that is genuinely spread " +
              "beyond one region.",
            <Dropdown.Single.Basic
              width="full"
              options={yesNoOptions}
              value={draft.quickTakeOffRegion ? "yes" : "no"}
              onChange={(value) =>
                setDraft((d) => ({ ...d, quickTakeOffRegion: value === "yes" }))
              }
            />,
          )}
        </StyledSettingsGrid>
      </ModalContent>
      <ModalFooter>
        <ButtonGroup>
          <Button label="Cancel" color="greyer" onClick={onClose} />
          <Button
            label="Save"
            color="primary"
            disabled={save.isPending}
            onClick={() => save.mutate()}
          />
        </ButtonGroup>
      </ModalFooter>
    </Modal>
  );
};
