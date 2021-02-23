import { getOneActant, Result } from "../index";
import { rethinkConfig } from "@service/RethinkDB";
import { paramMissingError } from "@common/constants";
import { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "http-status-codes";
import { r } from "rethinkdb-ts";
import { findUserByName, findUserById } from "@service/shorthands";
import {
  BadCredentialsError,
  BadParams,
  UserDoesNotExits,
} from "@common/errors";
import { checkPassword, generateAccessToken } from "@common/auth";
import { asyncRouteHandler } from "..";
import { use } from "chai";

export default Router()
  .post(
    "/signin",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const name = request.body.username;
      const rawPassword = request.body.password;

      if (!name || !rawPassword) {
        throw new BadParams("name and password have to be set");
      }

      console.log("user is signing in", name, rawPassword);

      const user = await findUserByName(request.db, name);
      if (!user) {
        throw new UserDoesNotExits(`user ${name} was not found`);
      }

      if (!checkPassword(rawPassword, user.password || "")) {
        throw new BadCredentialsError("unknown credentials");
      }

      user.password = undefined;

      response.json({
        token: generateAccessToken(user),
      });
    })
  )
  .get(
    "/get/:userId?",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("userId has to be set");
      }

      const user = await findUserById(request.db, userId as string);
      if (!user) {
        throw new UserDoesNotExits(`user ${userId} was not found`);
      }

      response.json(user);
    })
  );
