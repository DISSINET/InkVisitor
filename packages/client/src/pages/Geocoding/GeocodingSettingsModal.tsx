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
import {
  StyledBaseUrl,
  StyledDangling,
  StyledPick,
  StyledRowControls,
  StyledRowLabel,
  StyledFullRow,
  StyledSectionAction,
  StyledSectionActionNote,
  StyledSectionHeading,
  StyledSectionNote,
  StyledSettingsGrid,
} from "./GeocodingSettingsModalStyles";
import {
  nextBaseUrls,
  patchGeocodingContext,
  putGeocodingRoles,
  withEntry,
} from "./geocodingSettings";
import { GazetteerPicker } from "./GazetteerPicker";

/**
 * Assigning the entities that give a coordinate its meaning.
 *
 * Owner and admin only, because which Concept means `geo:x` decides what
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
   * The list as it is stored, so the section can say whether it holds anything
   * unwritten. Advanced by its own save rather than re-read, because the
   * settings query is refetched in the background and would otherwise move
   * under a list being edited.
   */
  const [savedSources, setSavedSources] = useState<string[]>(
    projectContext.disabledSources ?? [],
  );
  const sourcesChanged = disabledSources.join(",") !== savedSources.join(",");

  const assignedIds = useMemo(
    () =>
      [
        draft.x,
        draft.y,
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

  /**
   * The gazetteer list, written on its own.
   *
   * Everything else in this modal assigns an entity to a role; this says which
   * sources the engine may ask, which is a different kind of decision with a
   * different blast radius. One Save covering both would mean opening the modal
   * to correct a Concept and, by pressing the only button there is, also
   * committing whatever the gazetteer list happened to say.
   *
   * A replace rather than a merge, for the reason the roles are: this list is
   * the whole of what the project switches off, so a source switched back on is
   * one it no longer carries.
   */
  const saveSources = useMutation({
    mutationFn: () => patchGeocodingContext({ disabledSources }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["geocoding-settings"] });
      setSavedSources(disabledSources);
      toast.success("Gazetteer list saved.");
    },
    onError: () => toast.error("The gazetteer list could not be saved."),
  });

  const save = useMutation({
    mutationFn: async () => {
      // the draft holds every role, so a role the researcher unlinked is one
      // this object no longer carries — it has to replace, not merge
      await putGeocodingRoles(draft);
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
    onError: () => toast.error("The geocoding settings could not be saved."),
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

  const row = (
    label: string,
    id: string | undefined,
    entityClass: EntityEnums.Class,
    set: (entityId: string | null) => void,
    extra?: React.ReactNode,
  ) => (
    <React.Fragment key={label}>
      <StyledRowLabel>{label}</StyledRowLabel>
      <StyledRowControls>
        {/* a role holds one entity, so the suggester is what an empty role looks
            like and the tag is what a filled one looks like. Offering both would
            make picking a second entity a silent replacement of the first */}
        <StyledPick>
          {id ? (
            renderAssigned(id, () => set(null))
          ) : (
            <EntitySuggester
              categoryTypes={[entityClass]}
              alwaysShowCreateModal
              /* the suggester adds the class box and the create button to this,
                 and the whole control has to stay inside the slot so the base
                 URL field beside it starts where the assigned rows put it */
              inputWidth={130}
              onPicked={(entity) => set(entity.id)}
            />
          )}
        </StyledPick>
        {extra}
      </StyledRowControls>
    </React.Fragment>
  );

  return (
    <Modal showModal onClose={onClose} width="fat" fullHeight>
      <ModalHeader title="Global geocoding settings" onClose={onClose} />
      {/* the sections are a fixed length — twelve place types and fifteen
          gazetteers — so the body outgrows any viewport and scrolls inside
          the card, which keeps the footer and its save button in reach */}
      <ModalContent column enableScroll>
        <StyledSettingsGrid>
          <StyledSectionHeading>Coordinate roles</StyledSectionHeading>
          <StyledSectionNote>
            A coordinate is four metaproperties on a Location. Which Concept plays which role is
            set once for the project — it is what &ldquo;geocoded&rdquo; means, so it cannot differ
            between users.
          </StyledSectionNote>
          {row("geo:x — longitude", draft.x, EntityEnums.Class.Concept, (id) =>
            setDraft((d) => ({ ...d, x: id ?? "" })),
          )}
          {row("geo:y — latitude", draft.y, EntityEnums.Class.Concept, (id) =>
            setDraft((d) => ({ ...d, y: id ?? "" })),
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

          <StyledSectionHeading>Which gazetteers the engine asks</StyledSectionHeading>
          <StyledSectionNote>
            Switched off here, a source is never asked for this project — so it costs nothing and
            returns nothing. Set it for a source this corpus has no use for, or one whose licence
            does not cover this work; a researcher can switch further ones off for their own runs,
            but cannot switch these back on. This list has its own save, because it is the one
            thing here that is not an entity assignment.
          </StyledSectionNote>
          <StyledFullRow>
            <GazetteerPicker disabled={disabledSources} onChange={setDisabledSources} />
          </StyledFullRow>
          {/* its own button, because this is the one section of the modal that
              is not a role assignment — and a reader who came here to correct a
              Concept should not commit the gazetteer list by pressing Save */}
          <StyledFullRow>
            <StyledSectionAction>
              <Button
                label="Save the gazetteer list"
                color="primary"
                disabled={!sourcesChanged || saveSources.isPending}
                onClick={() => saveSources.mutate()}
              />
              {sourcesChanged ? (
                <StyledSectionActionNote>
                  not saved yet — the button below saves the assignments, not this list
                </StyledSectionActionNote>
              ) : null}
            </StyledSectionAction>
          </StyledFullRow>

          <StyledSectionHeading>Gazetteer resources</StyledSectionHeading>
          <StyledSectionNote>
            Fifteen, not sixteen: <code>llm-coords</code> is the model&apos;s own coordinate guess,
            has no record to cite, and never receives a reference. The base URL plus the stored
            identifier reconstructs a link back into the source; five of these publish no record URL
            and are left blank.
          </StyledSectionNote>
          {GAZETTEERS.map((source) =>
            row(
              source,
              draft.resources[source],
              EntityEnums.Class.Resource,
              (id) => {
                setDraft((d) => ({ ...d, resources: withEntry(d.resources, source, id) }));
                setBaseUrls((current) =>
                  nextBaseUrls(current, source, id, GAZETTEER_BASE_URLS[source]),
                );
              },
              <StyledBaseUrl>
                <Input
                  value={baseUrls[source] ?? GAZETTEER_BASE_URLS[source] ?? ""}
                  onChangeFn={(value) =>
                    setBaseUrls((current) => ({ ...current, [source]: value }))
                  }
                  placeholder="no record url"
                  changeOnType
                  width="full"
                />
              </StyledBaseUrl>,
            ),
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
      <Loader show={save.isPending} />
    </Modal>
  );
};
