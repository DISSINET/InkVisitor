import { asyncRouteHandler } from "../index";
import { Router, Request } from "express";
import {
  findActantById,
  findActantsByIds,
  findAssociatedActantIds,
  filterActantsByWildcard,
} from "@service/shorthands";
import { getActantType } from "@models/factory";
import {
  BadParams,
  ActantDoesNotExits,
  ModelNotValidError,
  InternalServerError,
  PermissionDeniedError,
} from "@shared/types/errors";
import {
  IActant,
  IResponseDetail,
  IResponseGeneric,
  IResponseStatement,
  IResponseActant,
  IResponseSearch,
  RequestSearch,
  IResponseAudit,
} from "@shared/types";
import { mergeDeep } from "@common/functions";
import Statement from "@models/statement";
import { ActantStatus, UserRole } from "@shared/enums";

export default Router().get(
  "/get/:actantId?",
  asyncRouteHandler<IResponseAudit>(async (request: Request) => {
    const actantId = request.params.actantId;

    if (!actantId) {
      throw new BadParams("actantId has to be set");
    }

    
    const actant = getActantType({ ...actantData });

    const usedInStatements = await Statement.findDependentStatements(
      request.db.connection,
      actant.id as string
    );

    return {
      ...actant,
      usedCount: usedInStatements.length,
      usedIn: usedInStatements,
      right: actant.getUserRoleMode(request.getUserOrFail()),
    } as IResponseActant;
  })
);
