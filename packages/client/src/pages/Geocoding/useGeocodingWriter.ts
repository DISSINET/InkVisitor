import { IEntity } from "@inkvisitor/shared/types";
import { IGeocodingRoles } from "@inkvisitor/shared/types/geocoding";
import { useQueryClient } from "@tanstack/react-query";
import api from "api";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import {
  GeocodingWriteInput,
  GeocodingWritePlan,
  isBlocked,
  planGeocodingWrite,
} from "./geocodingWrite";
import { GeocodingWriteGateway, executeGeocodingWrite } from "./geocodingWriteExecute";

/**
 * Wires the coordinate write to the API and the query cache.
 *
 * The planning and the ordering live in their own modules and are tested there;
 * this is only the plumbing — which calls to make, what to invalidate, and what
 * the researcher is told.
 */

/** What the write replaced, kept where the researcher can still reach it. */
export interface GeocodingWriteRecord {
  at: string;
  locationId: string;
  locationLabel: string;
  previous: GeocodingWritePlan["previous"];
  deletedValueIds: string[];
}

const RECORD_KEY = "geocodingWriteHistory";
const RECORD_LIMIT = 50;

/**
 * An EDIT audit stores the new state and not the old one, and a restore can only
 * recreate a deleted entity rather than undo an edit. So what a write replaced
 * exists nowhere unless this keeps it.
 *
 * Per browser, which is weak — but it is the difference between "we can tell you
 * what that coordinate used to be" and "nothing anywhere knows".
 */
const remember = (record: GeocodingWriteRecord) => {
  try {
    const stored = window.localStorage.getItem(RECORD_KEY);
    const history: GeocodingWriteRecord[] = stored ? JSON.parse(stored) : [];
    history.unshift(record);
    window.localStorage.setItem(RECORD_KEY, JSON.stringify(history.slice(0, RECORD_LIMIT)));
  } catch {
    /* a browser refusing site data cannot be made to keep this */
  }
};

export const readGeocodingWriteHistory = (): GeocodingWriteRecord[] => {
  try {
    return JSON.parse(window.localStorage.getItem(RECORD_KEY) || "[]");
  } catch {
    return [];
  }
};

const gateway = (locationLabel: string): GeocodingWriteGateway => ({
  createEntity: async (entity) => {
    await api.entityCreate(entity);
  },
  readEntity: async (entityId) => {
    const response = await api.entitiesGet([entityId]);
    const entity = response.data?.[0];
    if (!entity) {
      throw new Error(`location ${entityId} could not be re-read`);
    }
    return entity;
  },
  updateEntity: async (entityId, changes) => {
    await api.entityUpdate(entityId, changes);
  },
  // the route that refuses an entity something else still points at, never a
  // raw delete
  deleteEntity: async (entityId) => {
    await api.entityDelete(entityId);
  },
  recordPrevious: ({ locationId, previous, deleting }) =>
    remember({
      at: new Date().toISOString(),
      locationId,
      locationLabel,
      previous,
      deletedValueIds: deleting,
    }),
});

/** A write held back because it would replace a coordinate somebody already set. */
export interface PendingOverwrite {
  label: string;
  from: { lat: number; lon: number };
  to: { lat: number; lon: number };
  input: GeocodingWriteInput;
}

export interface UseGeocodingWriter {
  /**
   * Records one coordinate.
   *
   * `quiet` is for a run over many Locations: it holds back the per-write
   * success line and the refetch, because forty of each is forty notifications
   * nobody reads and forty reloads of a collection of two and a half thousand.
   * The caller says what happened once, and refetches once.
   */
  write: (
    input: GeocodingWriteInput,
    options?: {
      quiet?: boolean;
      /**
       * The replacement has already been agreed to, so do not stop to ask.
       *
       * For a run that was started as "geocode these": the question was answered
       * once, for the whole set, and asking it again per Location turns one
       * gesture into as many gestures as there are Locations.
       */
      confirmed?: boolean;
    },
  ) => Promise<boolean>;
  isWriting: boolean;
  /** Set when the write needs something the project has not configured. */
  blocked: string | null;
  clearBlocked: () => void;
  /**
   * A write waiting to be confirmed because it replaces an existing coordinate.
   *
   * Held here rather than asked for by the caller: every path that writes would
   * otherwise have to remember to ask, and the one that forgot would be the one
   * that overwrote a coordinate a researcher had checked.
   */
  pendingOverwrite: PendingOverwrite | null;
  confirmOverwrite: () => Promise<boolean>;
  cancelOverwrite: () => void;
}

export const useGeocodingWriter = (roles: IGeocodingRoles): UseGeocodingWriter => {
  const queryClient = useQueryClient();
  const [isWriting, setIsWriting] = useState(false);
  const [blocked, setBlocked] = useState<string | null>(null);

  const [pendingOverwrite, setPendingOverwrite] = useState<PendingOverwrite | null>(null);

  const write = useCallback(
    async (
      input: GeocodingWriteInput,
      options: { quiet?: boolean; confirmed?: boolean } = {},
    ): Promise<boolean> => {
      const { quiet = false, confirmed = false } = options;
      const plan = planGeocodingWrite(input);
      if (isBlocked(plan)) {
        setBlocked(plan.blocked);
        return false;
      }

      // a coordinate somebody already set is not replaced without being told
      // what is being lost, and the previous one is only nameable here
      if (plan.isOverwrite && !confirmed) {
        const { lat, lon } = input.current || {};
        if (lat != null && lon != null) {
          setPendingOverwrite({
            label: input.location.labels?.[0] || input.location.id,
            from: { lat, lon },
            to: { lat: input.lat, lon: input.lon },
            input,
          });
          return false;
        }
      }

      setIsWriting(true);
      try {
        const label = input.location.labels?.[0] || input.location.id;
        const outcome = await executeGeocodingWrite(
          input.location.id,
          input.location as IEntity,
          plan,
          roles,
          gateway(label),
        );

        if (!outcome.ok) {
          toast.error(outcome.reason);
          return false;
        }

        if (outcome.undeletedValueIds.length) {
          // the checked delete refusing is the guard working, not this failing.
          // Said even in a quiet run: it is the one outcome that is neither a
          // success nor a failure, and a run must not swallow it
          toast.info(
            `Coordinate saved. ${outcome.undeletedValueIds.length} replaced value(s) were kept because something else still refers to them.`,
          );
        } else if (!quiet) {
          toast.success(`Coordinate saved for ${label}.`);
        }

        // the list, the map and the counts all read one collection, so one
        // invalidation is what puts the new coordinate on screen
        if (!quiet) {
          queryClient.invalidateQueries({ queryKey: ["geocoding-locations"] });
          queryClient.invalidateQueries({ queryKey: ["geocoding-values"] });
        }
        return true;
      } finally {
        setIsWriting(false);
      }
    },
    [roles, queryClient],
  );

  const confirmOverwrite = useCallback(async () => {
    if (!pendingOverwrite) {
      return false;
    }
    const { input } = pendingOverwrite;
    setPendingOverwrite(null);
    return write(input, { confirmed: true });
  }, [pendingOverwrite, write]);

  return {
    write,
    isWriting,
    blocked,
    clearBlocked: () => setBlocked(null),
    pendingOverwrite,
    confirmOverwrite,
    cancelOverwrite: () => setPendingOverwrite(null),
  };
};
