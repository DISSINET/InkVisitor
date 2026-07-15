import { UserEnums } from "@inkvisitor/shared/enums";
import {
  IResponseGeneric,
  ISavedQuery,
  ISavedQueryCreate,
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

        const isOwner = existing.ownerId === user.id;
        // admins may moderate the shared folder, but other users' private
        // queries stay theirs alone
        const isSharedModerator =
          existing.shared &&
          user.hasRole([UserEnums.Role.Owner, UserEnums.Role.Admin]);
        if (!isOwner && !isSharedModerator) {
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
