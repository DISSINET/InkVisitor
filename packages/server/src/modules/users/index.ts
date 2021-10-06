import { Request } from "express";
import { Router } from "express";
import { IUser } from "@shared/types/user";
import User from "@models/user";
import {
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
  InternalServerError,
  UserDoesNotExits,
} from "@shared/types/errors";
import { checkPassword, generateAccessToken, hashPassword } from "@common/auth";
import { asyncRouteHandler } from "..";
import {
  IResponseBookmarkFolder,
  IResponseUser,
  IResponseStoredTerritory,
  IResponseAdministration,
  IActant,
  IResponseGeneric,
} from "@shared/types";

export default Router()
  .post(
    "/signin",
    asyncRouteHandler<unknown>(async (request: Request) => {
      const name = request.body.username;
      const rawPassword = request.body.password;

      if (!name || !rawPassword) {
        throw new BadParams("name and password have to be set");
      }

      const user = await User.findUserByLabel(request.db.connection, name);
      if (!user) {
        throw new UserDoesNotExits(`user ${name} was not found`, name);
      }

      if (!checkPassword(rawPassword, user.password || "")) {
        throw new BadCredentialsError("unknown credentials");
      }

      return {
        token: generateAccessToken(user),
      };
    })
  )
  .get(
    "/get/:userId?",
    asyncRouteHandler<IUser>(async (request: Request) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("userId has to be set");
      }

      const user = await User.getUser(request.db.connection, userId);
      if (!user) {
        throw new UserDoesNotExits(`user ${userId} was not found`, userId);
      }

      return user;
    })
  )
  .post(
    "/getMore",
    asyncRouteHandler<IUser[]>(async (request: Request) => {
      const label = request.body.label;

      if (!label) {
        return await User.findAllUsers(request.db.connection);
      }

      const byLabel = await User.findUserByLabel(request.db.connection, label);
      if (byLabel) {
        return [byLabel];
      }

      return [];
    })
  )
  .post(
    "/create",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
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
        return {
          result: true,
        };
      } else {
        throw new InternalServerError("cannot create user");
      }
    })
  )
  .put(
    "/update/:userId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const userId = request.params.userId || (request as any).user.user.id;

      console.log("userId", userId);
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

      const existingUser = await User.getUser(request.db.connection, userId);
      if (!existingUser) {
        throw new UserDoesNotExits(
          `user with id ${userId} does not exist`,
          userId
        );
      }

      const result = await updateUser(request.db, userId, userData);

      if (result.replaced) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update user ${userId}`);
      }
    })
  )
  .delete(
    "/delete/:userId?",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("user id has to be set");
      }

      const existingUser = await User.getUser(request.db.connection, userId);
      if (!existingUser) {
        throw new UserDoesNotExits(
          `user with id ${userId} does not exist`,
          userId
        );
      }

      const result = await deleteUser(request.db, userId);

      if (result.deleted === 1) {
        return {
          result: true,
        };
      } else {
        return {
          result: false,
          error: "InternalServerError",
          message: `user ${userId} could not be removed`,
        };
      }
    })
  )
  .get(
    "/bookmarks/:userId?",
    asyncRouteHandler<IResponseBookmarkFolder[]>(async (request: Request) => {
      if (!(request as any).user) {
        throw new BadParams("not logged");
      }

      const userId = request.params.userId || (request as any).user.user.id;

      if (!userId) {
        throw new BadParams("user id has to be set");
      }

      const user = await User.getUser(request.db.connection, userId);
      if (!user) {
        throw new UserDoesNotExits(
          `user with id ${userId} does not exist`,
          userId
        );
      }

      const out: IResponseBookmarkFolder[] = [];

      if (user.bookmarks) {
        for (const bookmark of user.bookmarks) {
          const bookmarkResponse: IResponseBookmarkFolder = {
            name: bookmark.name,
            id: bookmark.id,
            actants: [],
          };
          if (bookmark.actantIds && bookmark.actantIds.length) {
            for (const actant of await findActantsById(
              request.db,
              bookmark.actantIds
            )) {
              bookmarkResponse.actants[bookmark.actantIds.indexOf(actant.id)] =
                actant;
            }
          }
          out.push(bookmarkResponse);
        }
      }

      return out;
    })
  )
  .get(
    "/administration",
    asyncRouteHandler<IResponseAdministration>(async (request: Request) => {
      const out: IResponseAdministration = {
        users: [],
      };

      for (const user of await User.findAllUsers(request.db.connection)) {
        const userResponse: IResponseUser = {
          id: user.id,
          options: {
            defaultLanguage: "",
            defaultTerritory: "",
            searchLanguages: [],
          },
          rights: [],
          territoryRights: [],
          email: user.email,
          name: user.name,
          role: user.role,
          bookmarks: [],
          storedTerritories: [],
        };

        if (user.bookmarks) {
          for (const bookmark of user.bookmarks) {
            const bookmarkResponse: IResponseBookmarkFolder = {
              id: bookmark.id,
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
                });
              }
            }
            userResponse.bookmarks.push(bookmarkResponse);
          }
        }

        if (user.storedTerritories) {
          for (const territory of user.storedTerritories) {
            const territoryResponse: IResponseStoredTerritory = {
              territory: {
                ...(await findActantById<IActant>(
                  request.db,
                  territory.territoryId
                )),
                usedCount: await getActantUsage(
                  request.db,
                  territory.territoryId
                ),
                usedIn: [],
              },
            };
            userResponse.storedTerritories.push(territoryResponse);
          }
        }

        out.users.push(userResponse);
      }

      return out;
    })
  );
