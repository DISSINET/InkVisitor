import { Request } from "express";
import { Router } from "express";
import { IUser } from "@shared/types/user";
import User from "@models/user/user";
import { deleteUser } from "@service/shorthands";
import {
  BadCredentialsError,
  BadParams,
  EmailError,
  InternalServerError,
  ModelNotValidError,
  UserDoesNotExits,
  UserNotActiveError,
} from "@shared/types/errors";
import { checkPassword, generateAccessToken } from "@common/auth";
import { asyncRouteHandler } from "..";
import {
  IResponseBookmarkFolder,
  IResponseUser,
  IResponseAdministration,
  IResponseGeneric,
} from "@shared/types";
import mailer from "@service/mailer";
import { ResponseUser } from "@models/user/response";

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

      if (!user.active) {
        throw new UserNotActiveError(UserNotActiveError.message, user.id);
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
    "/administration",
    asyncRouteHandler<IResponseAdministration>(async (request: Request) => {
      const out: IResponseAdministration = {
        users: [],
      };

      for (const user of await User.findAllUsers(request.db.connection)) {
        const response = new ResponseUser(user);
        await response.unwindAll(request);
        out.users.push(response);
      }

      return out;
    })
  )
  .get(
    "/:userId",
    asyncRouteHandler<IResponseUser>(async (request: Request) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("userId has to be set");
      }

      const user = await User.getUser(request.db.connection, userId);
      if (!user) {
        throw new UserDoesNotExits(`user ${userId} was not found`, userId);
      }

      const response = new ResponseUser(user);
      await response.unwindAll(request);

      return response;
    })
  )
  .get(
    "/",
    asyncRouteHandler<IUser[]>(async (request: Request) => {
      const label = (request.query.label as string) || "";

      if (!label) {
        return await User.findAllUsers(request.db.connection);
      } else if (label.length < 2) {
        return [];
      }
      return await User.findUsersByLabel(request.db.connection, label);
    })
  )
  .post(
    "/",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const userData = request.body as IUser;

      const user = new User(userData);
      if (!user.isValid()) {
        throw new ModelNotValidError("invalid model");
      }

      const rawpassword = user.generatePassword();
      user.active = true;
      const result = await user.save(request.db.connection);

      if (result.inserted === 1) {
        try {
          await mailer.sendNewUser(user.email, {
            login: user.name,
            password: rawpassword,
          });
        } catch (e) {
          throw new EmailError(
            "please check the logs",
            (e as Error).toString()
          );
        }

        return {
          result: true,
        };
      } else {
        throw new InternalServerError("cannot create user");
      }
    })
  )
  .put(
    "/:userId",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const userId =
        request.params.userId !== "me"
          ? request.params.userId
          : (request as any).user.user.id;
      const userData = request.body as IUser;

      if (!userId || !userData || Object.keys(userData).length === 0) {
        throw new BadParams("user id and data have to be set");
      }

      const existingUser = await User.getUser(request.db.connection, userId);
      if (!existingUser) {
        throw new UserDoesNotExits(
          `user with id ${userId} does not exist`,
          userId
        );
      }

      const result = await existingUser.update(request.db.connection, {
        ...userData,
      });

      if (result.replaced || result.unchanged) {
        return {
          result: true,
        };
      } else {
        throw new InternalServerError(`cannot update user ${userId}`);
      }
    })
  )
  .delete(
    "/:userId",
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
    "/:userId/bookmarks",
    asyncRouteHandler<IResponseBookmarkFolder[]>(async (request: Request) => {
      if (!(request as any).user) {
        throw new BadParams("not logged");
      }

      const userId =
        request.params.userId !== "me"
          ? request.params.userId
          : (request as any).user.user.id;

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

      const response = new ResponseUser(user);
      await response.unwindBookmarks(request);

      return response.bookmarks;
    })
  )
  .post(
    "/:userId/password",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("userId has to be set");
      }

      const user = await User.getUser(request.db.connection, userId);
      if (!user) {
        throw new UserDoesNotExits(`user ${userId} was not found`, userId);
      }

      const raw = user.generatePassword();

      const result = await user.update(request.db.connection, {
        password: user.password,
      });

      if (!result.replaced && !result.unchanged) {
        throw new InternalServerError(`cannot update user ${userId}`);
      }

      console.log(`Password reset for ${user.email}: ${raw}`);

      try {
        await mailer.sendPasswordReset(user.email, {
          login: user.name,
          email: user.email,
          password: raw,
        });
      } catch (e) {
        throw new EmailError("please check the logs", (e as Error).toString());
      }

      return {
        result: true,
      };
    })
  )
  .get(
    "/me/emails/test",
    asyncRouteHandler<IResponseGeneric>(async (request: Request) => {
      const user = request.getUserOrFail();
      const email = request.query.email as string;
      if (!email) {
        throw new BadParams("email has to be set");
      }

      try {
        await mailer.sendTest(email, {
          name: user.name,
          email: user.email,
        });
      } catch (e) {
        throw new EmailError("please check the logs", (e as Error).toString());
      }

      return {
        result: true,
        message: `Test email sent to ${email}`,
      };
    })
  )
  .get(
    "/me",
    asyncRouteHandler<IResponseUser>(async (request: Request) => {
      const user = request.getUserOrFail();
      const response = new ResponseUser(user);
      await response.unwindAll(request);

      return response;
    })
  );
