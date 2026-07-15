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
} from "@inkvisitor/shared/types/errors";
import SavedQuery from "@models/saved-query/saved-query";
import { Router } from "express";
import { IRequest } from "src/custom_typings/request";
import { asyncRouteHandler } from "..";

const canModerate = (
  existing: SavedQuery,
  user: { id: string; hasRole: (roles: UserEnums.Role[]) => boolean }
): boolean => {
  const isOwner = existing.ownerId === user.id;
  // admins may moderate the shared folder, but other users' private
  // queries stay theirs alone
  const isSharedModerator =
    existing.shared &&
    user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin]);
  return isOwner || isSharedModerator;
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
        const next = new SavedQuery({
          ...existing,
          name: body.name !== undefined ? body.name : existing.name,
          shared: body.shared !== undefined ? body.shared : existing.shared,
          data: body.data !== undefined ? body.data : existing.data,
        });
        if (!next.isValid()) {
          throw new BadParams("name and data.query have to be set");
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
