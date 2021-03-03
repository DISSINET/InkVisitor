import { NextFunction, raw, Request, Response } from "express";
import { Router } from "express";
import { IUser } from "@shared/types/user";
import {
  findUserByName,
  findUserById,
  findUsersByLabel,
  createUser,
  updateUser,
  deleteUser,
  findActantsById,
  findActantById,
  getActantUsage,
} from "@service/shorthands";
import {
  BadCredentialsError,
  BadParams,
  UserDoesNotExits,
} from "@common/errors";
import { checkPassword, generateAccessToken, hashPassword } from "@common/auth";
import { asyncRouteHandler } from "..";
import {
  IResponseBookmarkFolder,
  IResponseBookmarks,
  IResponseUser,
  IResponseStoredTerritory,
} from "@shared/types";

export default Router()
  .post(
    "/signin",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const name = request.body.username;
      const rawPassword = request.body.password;

      if (!name || !rawPassword) {
        throw new BadParams("name and password have to be set");
      }

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
      const userData = request.body as IUser;

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
      const userData = request.body as IUser;

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
  )
  .delete(
    "/delete/:userId?",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("user id has to be set");
      }

      const result = await deleteUser(request.db, userId);

      if (result.deleted === 1) {
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
  .get(
    "/bookmarksGet/:userId?",
    asyncRouteHandler(async (request: Request, response: Response) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("user id has to be set");
      }

      const user = await findUserById(request.db, userId);
      if (!user) {
        throw new UserDoesNotExits(`user with id ${userId} does not exist`);
      }

      const out: IResponseBookmarks = {
        bookmarks: [],
      };

      if (user.bookmarks) {
        for (const bookmark of user.bookmarks) {
          const bookmarkResponse: IResponseBookmarkFolder = {
            name: bookmark.name,
            actants: [],
          };
          if (bookmark.actantIds && bookmark.actantIds.length) {
            for (const actant of await findActantsById(
              request.db,
              bookmark.actantIds
            )) {
              bookmarkResponse.actants.push({
                ...actant,
                usedCount: await getActantUsage(request.db, actant.id),
              });
            }
          }
          out.bookmarks.push(bookmarkResponse);
        }
      }

      response.json(out);
    })
  )
          }
        }
      }

      response.json(out);
    })
  );
