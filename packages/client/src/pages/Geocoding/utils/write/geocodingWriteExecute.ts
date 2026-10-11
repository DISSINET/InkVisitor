import { IEntity } from "@inkvisitor/shared/types";
import { IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import { GeocodingWritePlan, coordinateChanged } from "./geocodingWrite";

/**
 * Executing a geometry write.
 *
 * The ordering here is the only safety available. `PUT /entities/:entityId`
 * persists the raw request body, and RethinkDB's `update` replaces arrays rather
 * than merging them, so a `props` array built from a stale snapshot silently
 * erases whatever landed in between. There is no version field and no
 * conditional update anywhere on entities.
 *
 * So: create every child first, re-read the Location, refuse if its coordinate
 * changed, then write it exactly once. That does not make the write atomic — it
 * narrows the window from minutes to milliseconds and turns a silent loss into a
 * refusal the researcher sees.
 */

/** The calls this needs, named so a test can supply them without a server. */
export interface GeocodingWriteGateway {
  createEntity: (entity: IEntity) => Promise<void>;
  readEntity: (entityId: string) => Promise<IEntity>;
  updateEntity: (entityId: string, changes: Partial<IEntity>) => Promise<void>;
  /** Must be the route that refuses an entity still referenced elsewhere. */
  deleteEntity: (entityId: string) => Promise<void>;
  /**
   * Keeps what the write replaced. An EDIT audit stores only the new state, so
   * without this nothing anywhere can say what a coordinate used to be.
   */
  recordPrevious: (record: {
    locationId: string;
    previous: GeocodingWritePlan["previous"];
    deleting: string[];
  }) => void;
  /** Takes back the newest record for a Location, for a write that did not land. */
  discardPrevious: (locationId: string) => void;
}

export type GeocodingWriteOutcome =
  | { ok: true; orphanedValueIds: string[]; undeletedValueIds: string[] }
  | { ok: false; reason: string };

export const executeGeocodingWrite = async (
  locationId: string,
  before: IEntity,
  plan: GeocodingWritePlan,
  roles: IGeocodingRoles,
  gateway: GeocodingWriteGateway,
): Promise<GeocodingWriteOutcome> => {
  const created: string[] = [];

  // Values this write minted are attached to nothing once it is refused, and
  // nothing else would ever find them
  const discardCreated = async () => {
    for (const valueId of created) {
      try {
        await gateway.deleteEntity(valueId);
      } catch {
        // best effort: the refusal being reported matters more than the tidy-up
      }
    }
  };

  // children first: a create that fails leaves unreferenced Value entities,
  // which are attached to nothing and invisible in the corpus. The Location
  // cannot end up carrying a geometry that does not exist, because it has not
  // been touched yet.
  for (const value of plan.newValues) {
    try {
      await gateway.createEntity(value);
      created.push(value.id);
    } catch {
      await discardCreated();
      return {
        ok: false,
        reason: "Could not create the geometry value, so nothing was written to the location.",
      };
    }
  }

  let current: IEntity;
  try {
    current = await gateway.readEntity(locationId);
  } catch {
    await discardCreated();
    return { ok: false, reason: "Could not re-read the location before writing, so nothing was written." };
  }

  if (coordinateChanged(before, current, roles)) {
    await discardCreated();
    return {
      ok: false,
      reason:
        "This location's geometry changed while you were working on it. Nothing was written — reload and decide again.",
    };
  }

  gateway.recordPrevious({
    locationId,
    previous: plan.previous,
    deleting: plan.displacedValueIds,
  });

  try {
    await gateway.updateEntity(locationId, { props: plan.props, references: plan.references });
  } catch {
    gateway.discardPrevious(locationId);
    await discardCreated();
    return { ok: false, reason: "The location could not be updated, so nothing was written." };
  }

  // after the update lands: until then these Values are still the live ones
  const undeleted: string[] = [];
  for (const valueId of plan.displacedValueIds) {
    try {
      await gateway.deleteEntity(valueId);
    } catch {
      // the checked delete refuses an entity something else still points at,
      // which is the guard working rather than a failure of this write
      undeleted.push(valueId);
    }
  }

  return { ok: true, orphanedValueIds: created, undeletedValueIds: undeleted };
};
