import { UserEnums } from "@inkvisitor/shared/enums";
import {
  IResponseGeneric,
  ISavedQuery,
  ISavedQueryCreate,
  ISavedQueryUpdate,
} from "@inkvisitor/shared/types";
import {
  BadParams,
  InternalServerError,
  NotFound,
  PermissionDeniedError,
  SavedQueryNameNotUnique,
} from "@inkvisitor/shared/types/errors";
import SavedQuery from "@models/saved-query/saved-query";
import { Router } from "express";
import { IRequest } from "src/custom_typings/request";
import { asyncRouteHandler } from "..";

type ModeratingUser = {
  id: string;
  hasRole: (roles: UserEnums.Role[]) => boolean;
};

// shared queries live in the shared folder and are managed collaboratively by
// editors and up — a viewer cannot moderate them or mark a query as shared in
// the first place.
const canShare = (user: ModeratingUser): boolean =>
  user.hasRole([
    UserEnums.Role.Owner,
    UserEnums.Role.Admin,
    UserEnums.Role.Editor,
  ]);

// the folder a query lands in decides which names it may not reuse, so the
// message names that folder rather than the query it collided with (a user
// cannot see another user's private queries)
const nameTakenMessage = (shared: boolean): string =>
  shared
    ? "a shared query with this name already exists"
    : "you already have a query with this name";

const canModerate = (existing: SavedQuery, user: ModeratingUser): boolean => {
  // shared queries: admins/owners moderate any, editors only the ones they
  // created themselves. private queries stay with their owner alone (nobody
  // else can touch another user's private query).
  if (existing.shared) {
    return (
      user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin]) ||
      (existing.ownerId === user.id && canShare(user))
    );
  }
  return existing.ownerId === user.id;
};

export default Router()
  .get(
    "/",
    asyncRouteHandler<IResponseGeneric<ISavedQuery[]>>(
      async (request: IRequest) => {
        const user = request.getUserOrFail();
        const items = await SavedQuery.findVisibleForUser(
          request.db.connection,
          user.id
        );
        return { result: true, data: items };
      }
    )
  )
  .post(
    "/",
    asyncRouteHandler<IResponseGeneric<ISavedQuery>>(
      async (request: IRequest<unknown, ISavedQueryCreate>) => {
        const user = request.getUserOrFail();
        const body = request.body;

        if (body?.shared && !canShare(user)) {
          throw new PermissionDeniedError(
            "only an admin can create a shared saved query"
          );
        }

        const model = new SavedQuery({
          name: body?.name,
          shared: body?.shared,
          data: body?.data,
          ownerId: user.id, // always from the session, never from the body
          createdAt: new Date(),
        });
        if (!model.isValid()) {
          throw new BadParams("name and data.query have to be set");
        }
        if (
          await SavedQuery.isNameTaken(
            request.db.connection,
            model.name,
            model.shared,
            model.ownerId
          )
        ) {
          throw new SavedQueryNameNotUnique(nameTakenMessage(model.shared));
        }

        const saved = await model.save(request.db.connection);
        if (!saved) {
          throw new InternalServerError("cannot create saved query");
        }

        return { result: true, data: model };
      }
    )
  )
  .put(
    "/:id",
    asyncRouteHandler<IResponseGeneric<ISavedQuery>>(
      async (request: IRequest<{ id: string }, ISavedQueryUpdate>) => {
        const user = request.getUserOrFail();
        const id = request.params.id;
        if (!id) {
          throw new BadParams("saved query id has to be set");
        }

        const existing = await SavedQuery.findById(request.db.connection, id);
        if (!existing) {
          throw new NotFound(`saved query ${id} not found`);
        }
        if (!canModerate(existing, user)) {
          throw new PermissionDeniedError(
            "only the owner or an admin can update this saved query"
          );
        }

        const body = request.body ?? {};
        // a viewer may not turn their own private query into a shared one
        if (body.shared === true && !canShare(user)) {
          throw new PermissionDeniedError(
            "only an admin can share a saved query"
          );
        }
        const next = new SavedQuery({
          ...existing,
          name: body.name !== undefined ? body.name : existing.name,
          shared: body.shared !== undefined ? body.shared : existing.shared,
          data: body.data !== undefined ? body.data : existing.data,
        });
        if (!next.isValid()) {
          throw new BadParams("name and data.query have to be set");
        }

        // renaming and moving a query between folders both change which names
        // it competes with, so either one re-runs the check
        if (body.name !== undefined || body.shared !== undefined) {
          if (
            await SavedQuery.isNameTaken(
              request.db.connection,
              next.name,
              next.shared,
              existing.ownerId,
              existing.id
            )
          ) {
            throw new SavedQueryNameNotUnique(nameTakenMessage(next.shared));
          }
        }

        const updateData: ISavedQueryUpdate = {};
        if (body.name !== undefined) {
          updateData.name = next.name;
        }
        if (body.shared !== undefined) {
          updateData.shared = next.shared;
        }
        if (body.data !== undefined) {
          updateData.data = next.data;
        }
        if (Object.keys(updateData).length === 0) {
          throw new BadParams("at least one field to update has to be set");
        }

        const result = await existing.update(request.db.connection, updateData);
        if (result.replaced === 0 && result.unchanged === 0) {
          throw new InternalServerError(`cannot update saved query ${id}`);
        }

        return { result: true, data: next };
      }
    )
  )
  .delete(
    "/:id",
    asyncRouteHandler<IResponseGeneric>(
      async (request: IRequest<{ id: string }>) => {
        const user = request.getUserOrFail();
        const id = request.params.id;
        if (!id) {
          throw new BadParams("saved query id has to be set");
        }

        const existing = await SavedQuery.findById(request.db.connection, id);
        if (!existing) {
          throw new NotFound(`saved query ${id} not found`);
        }
        if (!canModerate(existing, user)) {
          throw new PermissionDeniedError(
            "only the owner or an admin can delete this saved query"
          );
        }

        const result = await existing.delete(request.db.connection);
        if (!result.deleted) {
          throw new InternalServerError(`cannot delete saved query ${id}`);
        }

        return { result: true };
      }
    )
  );
