import { EntityEnums } from "@inkvisitor/shared/enums";
import { IEntity } from "@inkvisitor/shared/types";
import {
  GeocodingAccuracy,
  IGeocodingContext,
  IGeocodingRoles,
  rolesShareAConcept,
} from "@inkvisitor/shared/types/geocoding";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "api";
import {
  Button,
  ButtonGroup,
  CancelButton,
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
import { GAZETTEERS, GAZETTEER_BASE_URLS } from "../../utils/context/gazetteerBaseUrls";
import { LLM_SOURCE } from "../../utils/context/gazetteerCatalogue";
import {
  StyledBaseUrl,
  StyledDangling,
  StyledPick,
  StyledRowControls,
  StyledRowLabel,
  StyledFullRow,
  StyledKindsRow,
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
} from "../../utils/context/geocodingSettings";
import { GazetteerColumn, GazetteerPicker } from "../../components/gazetteer/GazetteerPicker";
import { StyledGazetteerNote } from "../../components/gazetteer/GazetteerPickerStyles";
import { PlaceTypeTable } from "../../components/placeType/PlaceTypeTable";
import {
  PLACE_TYPE_ASSIGNMENTS_KEY,
  usePlaceTypeAssignments,
} from "../../hooks/usePlaceTypeAssignments";

/**
 * Assigning the entities that give a coordinate its meaning.
 *
 * Owner only (the menu hides the entry from everyone else), because which Concept means
 * `geo:geometry` decides what
 * "geocoded" means: if one user could point it elsewhere, the same Location
 * would read as geocoded for them and not for anyone else.
 *
 * Every field selects an existing entity or creates one, so a fresh deployment
 * needs no seeding job.
 */

const NAMELESS = "Every location type needs a name.";
const SHARED_CONCEPT = "One Concept cannot be used for two of the coordinate roles.";

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
    projectContext.disabledSources ?? []
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
        draft.epistemicSource,
        ...Object.values(draft.accuracyValues),
        ...draft.placeTypes.map((one) => one.conceptId),
        ...Object.values(draft.resources),
      ].filter((id): id is string => !!id),
    [draft]
  );

  // the counts are of Locations, and a Classification can have any entity as its
  // subject, so the Locations are listed once to count against
  const { data: locationIds } = useQuery({
    queryKey: ["geocoding-all-location-ids"],
    queryFn: async () => {
      const response = await api.entitiesSearch({ class: EntityEnums.Class.Location });
      return new Set((response.data ?? []).map((entity) => entity.id));
    },
    staleTime: 60_000,
  });
  const assignments = usePlaceTypeAssignments(draft.placeTypes, locationIds);

  // every pick changes the id list and so the query key; the previous batch
  // keeps the other rows on screen while the new one loads
  const { data: assignedEntities, isFetching: loadingAssigned } = useEntitiesQuery(
    "geocoding-settings",
    assignedIds,
    { keepPrevious: true }
  );
  // what the suggester handed over, so a picked tag shows before its fetch lands
  const [picked, setPicked] = useState<Record<string, IEntity>>({});

  const byId = useMemo(() => {
    const map: Record<string, IEntity> = { ...picked };
    for (const entity of assignedEntities || []) {
      map[entity.id] = entity;
    }
    return map;
  }, [assignedEntities, picked]);

  const save = useMutation({
    mutationFn: async () => {
      if (draft.placeTypes.some((one) => !one.name.trim())) {
        throw new Error(NAMELESS);
      }
      // the roles are told apart by their Concept, so one Concept in two of them
      // would make the geometry and the accuracy under it the same thing
      if (rolesShareAConcept(draft)) {
        throw new Error(SHARED_CONCEPT);
      }
      // the draft holds every role, so a role the researcher unlinked is absent
      // from this object — it has to replace, not merge
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
      queryClient.invalidateQueries({ queryKey: [PLACE_TYPE_ASSIGNMENTS_KEY] });
      toast.success("Geocoding settings saved.");
      onClose();
    },
    onError: (error) => {
      if (error instanceof Error && [NAMELESS, SHARED_CONCEPT].includes(error.message)) {
        toast.error(error.message);
        return;
      }
      // a save is several writes, and the earlier ones may have landed
      queryClient.invalidateQueries({ queryKey: ["geocoding-settings"] });
      toast.error(
        "The geocoding settings could not be saved completely. Some changes may have been written; reopen this window to see which."
      );
    },
  });

  const renderAssigned = (id: string, unlink: () => void) => {
    const entity = byId[id];
    // an id the batch has not answered for yet is not a deleted one
    if (!entity && loadingAssigned) {
      return null;
    }
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
      <EntityTag
        entity={entity}
        fullWidth
        unlinkButton={{ onClick: unlink, tooltipLabel: "unlink entity" }}
      />
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
    set: (entityId: string | null) => void
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
          onPicked={(entity) => {
            setPicked((current) => ({ ...current, [entity.id]: entity }));
            set(entity.id);
          }}
        />
      )}
    </StyledPick>
  );

  const row = (
    label: string,
    id: string | undefined,
    entityClass: EntityEnums.Class,
    set: (entityId: string | null) => void
  ) => (
    <React.Fragment key={label}>
      <StyledRowLabel>{label}</StyledRowLabel>
      <StyledRowControls>{picker(id, entityClass, set)}</StyledRowControls>
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
            setBaseUrls((current) =>
              nextBaseUrls(current, source, id, GAZETTEER_BASE_URLS[source])
            );
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
      {/* the sections are a fixed length — twelve location types and fifteen
          gazetteers — so the body outgrows any viewport and scrolls inside
          the card, which keeps the footer and its save button in reach */}
      <ModalContent column enableScroll>
        <StyledSettingsGrid>
          <StyledSectionHeading>Coordinate roles</StyledSectionHeading>
          <StyledSectionNote>
            Choose (or create) the Concept holding geographic coordinates in GeoJSON format, the
            Concept holding localisation accuracy, and the Concept holding the source of knowledge.
            Without the last one the gazetteers are recorded as references only, and the
            coordinate does not name them.
          </StyledSectionNote>
          {row("concept for referencing geocoding in GeoJSON format", draft.geometry, EntityEnums.Class.Concept, (id) =>
            setDraft((d) => ({ ...d, geometry: id ?? "" }))
          )}
          {row("concept for localisation accuracy", draft.accuracy, EntityEnums.Class.Concept, (id) =>
            setDraft((d) => ({ ...d, accuracy: id ?? "" }))
          )}
          {row("concept for the source of knowledge", draft.epistemicSource, EntityEnums.Class.Concept, (id) =>
            setDraft((d) => ({ ...d, epistemicSource: id ?? "" }))
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
              }))
            )
          )}

          <StyledSectionHeading>Location types</StyledSectionHeading>
          <StyledSectionNote>
            The project&apos;s location typology. The gazetteer location type select maps it onto
            the gazetteers&apos; general typology, which is then used for prioritising the proper
            category. A Concept must be assigned if you want to geocode that general type.
          </StyledSectionNote>
          <StyledKindsRow>
            <PlaceTypeTable
              value={draft.placeTypes}
              onChange={(placeTypes) => setDraft((d) => ({ ...d, placeTypes }))}
              renderConcept={(conceptId, set) =>
                picker(conceptId || undefined, EntityEnums.Class.Concept, set)
              }
              counts={assignments.countByType}
              inferredCounts={assignments.inferredByType}
              truncatedTypes={assignments.truncatedTypes}
              countsLoading={assignments.isLoading || !locationIds}
              countsFailed={!!assignments.error}
            />
          </StyledKindsRow>

          <StyledSectionHeading>Gazetteers</StyledSectionHeading>
          <StyledSectionNote>
            Gazetteers not checked in the checkbox to the left are not searched. Resource: the
            entity that stands for the gazetteer when its coordinates are cited. Record URL: the
            beginning of the link to a record in the gazetteer, to which the record&apos;s identifier
            is added; leave it empty where a gazetteer&apos;s links do not end in the identifier.
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
          <CancelButton onClick={onClose} />
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
