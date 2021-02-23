import { NextFunction, raw, Request, Response } from "express";
import { Router } from "express";
import { UserI } from "@shared/types/user";
import {
  findUserByName,
  findUserById,
  findUsersByLabel,
  createUser,
  updateUser,
} from "@service/shorthands";
import {
  BadCredentialsError,
  BadParams,
  UserDoesNotExits,
} from "@common/errors";
import { checkPassword, generateAccessToken, hashPassword } from "@common/auth";
import { asyncRouteHandler } from "..";

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
  )
  .post(
    "/getMore",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const label = request.body.label;

      if (!label) {
        throw new BadParams("label has to be set");
      }

      const users = await findUsersByLabel(request.db, label as string);

      response.json(users);
    })
  )
  .post(
    "/create",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const userData = request.body as UserI;

      if (
        !userData ||
        !userData.email ||
        !userData.name ||
        !userData.password
      ) {
        throw new BadParams("user data have to be set");
      }

      userData.password = hashPassword(userData.password);
      const result = await createUser(request.db, userData);

      if (result.inserted === 1) {
        response.json({
          success: true,
        });
      } else {
        response.json({
          success: false,
          errors: result.errors,
        });
      }
    })
  )
  .put(
    "/update/:userId?",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const userId = request.params.userId;
      const userData = request.body as UserI;

      if (!userId || !userData || Object.keys(userData).length === 0) {
        throw new BadParams("user id and data have to be set");
      }

      const allowedKeys = [
        "email",
        "name",
        "password",
        "role",
        "bookmarks",
        "storedTerritories",
      ];
      for (const key of Object.keys(userData)) {
        if (allowedKeys.indexOf(key) === -1) {
          throw new BadParams("user data have unsupported keys");
        }
      }

      if (userData.password) {
        userData.password = hashPassword(userData.password);
      }

      const result = await updateUser(request.db, userId, userData);

      if (result.replaced) {
        response.json({
          success: true,
        });
      } else {
        response.json({
          success: false,
          errors: result.errors,
        });
      }
    })
  );
