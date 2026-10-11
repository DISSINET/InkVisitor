import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import {
  GEOCODING_PLACE_TYPES,
  GeocodingAccuracy,
  IGeocodingContext,
  IGeocodingRoles,
} from "@inkvisitor/shared/types/geocoding";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  Input,
  Loader,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "components";
import { EntitySuggester, EntityTag } from "components/advanced";
import { useEntitiesQuery } from "hooks/react-query/useEntitiesQuery";
import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { IcoUnlink } from "Theme/icons";
import { GAZETTEERS, GAZETTEER_BASE_URLS } from "./gazetteerBaseUrls";
import { LLM_SOURCE } from "./gazetteerCatalogue";
import {
  StyledBaseUrl,
  StyledDangling,
  StyledPick,
  StyledRowControls,
  StyledRowLabel,
  StyledFullRow,
  StyledSectionHeading,
  StyledSectionNote,
  StyledScrollRow,
  StyledSettingsGrid,
  StyledUnsavedNote,
} from "./GeocodingSettingsModalStyles";
import {
  nextBaseUrls,
  patchGeocodingContext,
  putGeocodingRoles,
  withEntry,
} from "./geocodingSettings";
import { GazetteerColumn, GazetteerPicker } from "./GazetteerPicker";
import { StyledGazetteerNote } from "./GazetteerPickerStyles";

/**
 * Assigning the entities that give a coordinate its meaning.
 *
 * Owner and admin only, because which Concept means `geo:geometry` decides what
 * "geocoded" means: if one user could point it elsewhere, the same Location
 * would read as geocoded for them and not for anyone else.
 *
 * Every field selects an existing entity or creates one, so a fresh deployment
 * needs no seeding job.
 */

interface GeocodingSettingsModal {
  roles: IGeocodingRoles;
  /** The project's own query context, of which this modal owns one field. */
  projectContext: IGeocodingContext;
  onClose: () => void;
}

export const GeocodingSettingsModal: React.FC<GeocodingSettingsModal> = ({
  roles,
  projectContext,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<IGeocodingRoles>(roles);
  const [baseUrls, setBaseUrls] = useState<Record<string, string>>({});
  const [disabledSources, setDisabledSources] = useState<string[]>(
    projectContext.disabledSources ?? [],
  );
  /**
   * The list as the modal opened it, so Save writes the list only when it was
   * changed. Held in state rather than read from the prop: the settings query is
   * refetched in the background and would otherwise move under a list being
   * edited.
   */
  const [openedSources] = useState(() => (projectContext.disabledSources ?? []).join(","));
  const sourcesChanged = disabledSources.join(",") !== openedSources;

  const assignedIds = useMemo(
    () =>
      [
        draft.geometry,
        draft.accuracy,
        draft.type,
        ...Object.values(draft.accuracyValues),
        ...Object.values(draft.placeTypes),
        ...Object.values(draft.resources),
      ].filter((id): id is string => !!id),
    [draft],
  );

  const { data: assignedEntities } = useEntitiesQuery("geocoding-settings", assignedIds);

  const byId = useMemo(() => {
    const map: Record<string, IEntity> = {};
    for (const entity of assignedEntities || []) {
      map[entity.id] = entity;
    }
    return map;
  }, [assignedEntities]);

  const save = useMutation({
    mutationFn: async () => {
      // the draft holds every role, so a role the researcher unlinked is one
      // this object no longer carries — it has to replace, not merge
      await putGeocodingRoles(draft);
      // after the roles, not beside them: both rewrite the one settings row, and
      // two writes in flight would leave only whichever landed last
      if (sourcesChanged) {
        await patchGeocodingContext({ disabledSources });
      }
      // a Resource created here carries no base url; the deep link needs one,
      // and only the entity detail form otherwise offers the field
      for (const [source, url] of Object.entries(baseUrls)) {
        const resourceId = draft.resources[source];
        const existing = resourceId ? byId[resourceId] : undefined;
        if (!resourceId || !existing || !url) {
          continue;
        }
        await api.entityUpdate(resourceId, {
          data: { ...(existing.data || {}), partValueBaseURL: url },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geocoding-settings"] });
      queryClient.invalidateQueries({ queryKey: ["geocoding-locations"] });
      queryClient.invalidateQueries({ queryKey: ["geocoding-values"] });
      toast.success("Geocoding settings saved.");
      onClose();
    },
    onError: () => {
      // a save is several writes, and the earlier ones may have landed
      queryClient.invalidateQueries({ queryKey: ["geocoding-settings"] });
      toast.error(
        "The geocoding settings could not be saved completely. Some changes may have been written; reopen this window to see which.",
      );
    },
  });

  const renderAssigned = (id: string, unlink: () => void) => {
    const entity = byId[id];
    // /entities/batch drops ids it cannot find, and nothing tidies settings when
    // an entity is deleted, so a stored id can outlive what it points at. The
    // unlink is the only way out of that state from here
    if (!entity) {
      return (
        <>
          <StyledDangling>missing: {id}</StyledDangling>
          <Button
            icon={<IcoUnlink />}
            color="danger"
            inverted
            tooltipLabel="unlink entity"
            onClick={unlink}
          />
        </>
      );
    }
    return (
      <EntityTag entity={entity} unlinkButton={{ onClick: unlink, tooltipLabel: "unlink entity" }} />
    );
  };

  /**
   * What fills a role: the entity it points at, or the suggester that picks one.
   *
   * A role holds one entity, so the suggester is what an empty role looks like
   * and the tag is what a filled one looks like. Offering both would make
   * picking a second entity a silent replacement of the first.
   */
  const picker = (
    id: string | undefined,
    entityClass: EntityEnums.Class,
    set: (entityId: string | null) => void,
  ) => (
    <StyledPick>
      {id ? (
        renderAssigned(id, () => set(null))
      ) : (
        <EntitySuggester
          categoryTypes={[entityClass]}
          alwaysShowCreateModal
          /* the suggester adds the class box and the create button to this,
             and the whole control has to stay inside the slot so the column
             beside it starts where the assigned rows put it */
          inputWidth={130}
          onPicked={(entity) => set(entity.id)}
        />
      )}
    </StyledPick>
  );

  const row = (
    label: string,
    id: string | undefined,
    entityClass: EntityEnums.Class,
    set: (entityId: string | null) => void,
  ) => (
    <React.Fragment key={label}>
      <StyledRowLabel>{label}</StyledRowLabel>
      <StyledRowControls>
        {picker(id, entityClass, set)}
      </StyledRowControls>
    </React.Fragment>
  );

  /**
   * The resource and record URL of each source, beside its switch.
   *
   * `llm-coords` is the model's own coordinate guess: it has no record to cite and
   * never receives a reference, so it has no resource to assign. A source the
   * engine has grown that this page has never heard of is shown the same way,
   * because a Resource for it would have no base URL to prefill and nothing
   * would read it.
   */
  const gazetteerColumns: GazetteerColumn[] = [
    {
      title: "resource",
      width: "21rem",
      render: (source) =>
        GAZETTEERS.includes(source) ? (
          picker(draft.resources[source], EntityEnums.Class.Resource, (id) => {
            setDraft((d) => ({ ...d, resources: withEntry(d.resources, source, id) }));
            setBaseUrls((current) => nextBaseUrls(current, source, id, GAZETTEER_BASE_URLS[source]));
          })
        ) : (
          <StyledGazetteerNote>
            {source === LLM_SOURCE ? "no record to cite" : "no resource for this source"}
          </StyledGazetteerNote>
        ),
    },
    {
      title: "record URL",
      width: "minmax(14rem, 1fr)",
      render: (source) => {
        if (!GAZETTEERS.includes(source)) {
          return null;
        }
        // the URL lives on the Resource entity, so a source with none has nothing
        // to hold it; what is shown is what Save writes: an edit made here, or
        // else what the entity already stores
        const resourceId = draft.resources[source];
        const stored = resourceId
          ? ((byId[resourceId]?.data as { partValueBaseURL?: string } | undefined)
              ?.partValueBaseURL ?? "")
          : "";
        return (
          <StyledBaseUrl>
            <Input
              value={resourceId ? (baseUrls[source] ?? stored) : ""}
              onChangeFn={(value) => setBaseUrls((current) => ({ ...current, [source]: value }))}
              placeholder={resourceId ? "no record url" : "assign a resource first"}
              disabled={!resourceId}
              changeOnType
              width="full"
            />
          </StyledBaseUrl>
        );
      },
    },
  ];

  return (
    <Modal showModal onClose={onClose} width={1300} fullHeight>
      <ModalHeader title="Global geocoding settings" onClose={onClose} />
      {/* the sections are a fixed length — twelve place types and fifteen
          gazetteers — so the body outgrows any viewport and scrolls inside
          the card, which keeps the footer and its save button in reach */}
      <ModalContent column enableScroll>
        <StyledSettingsGrid>
          <StyledSectionHeading>Coordinate roles</StyledSectionHeading>
          <StyledSectionNote>
            A geocoded Location carries three metaproperties: a GeoJSON geometry, an accuracy and a kind of place. Which Concept plays which role is
            set once for the project — it is what &ldquo;geocoded&rdquo; means, so it cannot differ
            between users.
          </StyledSectionNote>
          {row("geo:geometry — GeoJSON geometry", draft.geometry, EntityEnums.Class.Concept, (id) =>
            setDraft((d) => ({ ...d, geometry: id ?? "" })),
          )}
          {row("geo:accuracy", draft.accuracy, EntityEnums.Class.Concept, (id) =>
            setDraft((d) => ({ ...d, accuracy: id ?? "" })),
          )}
          {row("geo:type", draft.type, EntityEnums.Class.Concept, (id) =>
            setDraft((d) => ({ ...d, type: id ?? "" })),
          )}

          <StyledSectionHeading>Accuracy values</StyledSectionHeading>
          <StyledSectionNote>
            The four Concepts a researcher chooses between when accepting a coordinate.
          </StyledSectionNote>
          {Object.values(GeocodingAccuracy).map((accuracy) =>
            row(accuracy, draft.accuracyValues[accuracy], EntityEnums.Class.Concept, (id) =>
              setDraft((d) => ({
                ...d,
                accuracyValues: withEntry(d.accuracyValues, accuracy, id),
              })),
            ),
          )}

          <StyledSectionHeading>Place types</StyledSectionHeading>
          <StyledSectionNote>
            Twelve, matching the engine&apos;s own vocabulary. A type with no Concept assigned
            blocks the write rather than being dropped — a controlled vocabulary that grows from
            outside is not controlled.
          </StyledSectionNote>
          {GEOCODING_PLACE_TYPES.map((placeType) =>
            row(placeType, draft.placeTypes[placeType], EntityEnums.Class.Concept, (id) =>
              setDraft((d) => ({ ...d, placeTypes: withEntry(d.placeTypes, placeType, id) })),
            ),
          )}

          <StyledSectionHeading>Gazetteers</StyledSectionHeading>
          <StyledSectionNote>
            One row per source the engine can ask. Switched off, a source is never asked for this
            project, so it costs nothing and returns nothing: use it for a source this corpus has
            no use for, or one whose licence does not cover this work. A researcher can switch
            further sources off for their own runs, but cannot switch these back on. The resource
            is the entity a reference to the source points at, and the record URL plus the stored
            identifier rebuilds a link back into it; a source whose record URL does not end in the
            identifier is left blank.
          </StyledSectionNote>
          <StyledScrollRow>
            <GazetteerPicker
              disabled={disabledSources}
              onChange={setDisabledSources}
              columns={gazetteerColumns}
            />
          </StyledScrollRow>
          {sourcesChanged ? (
            <StyledFullRow>
              <StyledUnsavedNote>
                The switches above are changed. Save writes them for the whole project, together
                with everything else in this window.
              </StyledUnsavedNote>
            </StyledFullRow>
          ) : null}
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
      <Loader show={save.isPending} />
    </Modal>
  );
};
