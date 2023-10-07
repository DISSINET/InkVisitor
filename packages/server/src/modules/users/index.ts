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
  PermissionDeniedError,
  UserDoesNotExits,
  UserNotActiveError,
} from "@shared/types/errors";
import { checkPassword, generateAccessToken, hashPassword } from "@common/auth";
import { asyncRouteHandler } from "..";
import {
  IResponseBookmarkFolder,
  IResponseUser,
  IResponseAdministration,
  IResponseGeneric,
} from "@shared/types";
import mailer, {
  passwordResetTemplate,
  testTemplate,
  userCreatedTemplate,
} from "@service/mailer";
import { ResponseUser } from "@models/user/response";
import { domainName, hostUrl } from "@common/functions";
import { IRequest } from "src/custom_typings/request";

export default Router()
  /**
   * @openapi
   * /users/signin:
   *   post:
   *     description: Attempts to signin
   *     tags:
   *       - users
   *     requestBody:
   *       description: Login credentials
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               username:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 token:
   *                   type: string
   */
  .post(
    "/signin",
    asyncRouteHandler<unknown>(async (request: IRequest) => {
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
        throw new UserNotActiveError(UserNotActiveError.message, user.email);
      }

      if (!checkPassword(rawPassword, user.password || "")) {
        throw new BadCredentialsError("unknown credentials");
      }

      return {
        token: generateAccessToken(user),
      };
    })
  )
  /**
   * @openapi
   * /users/administration:
   *   get:
   *     description: Attempts to signin
   *     tags:
   *       - users
   *     responses:
   *       200:
   *         description: Returns object containing users
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/IResponseAdministration"
   */
  .get(
    "/administration",
    asyncRouteHandler<IResponseAdministration>(async (request: IRequest) => {
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
  /**
   * @openapi
   * /users/me:
   *   get:
   *     description: Returns user detail for current user
   *     tags:
   *       - users
   *     responses:
   *       200:
   *         description: Returns IResponseUser object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseUser"
   */
  .get(
    "/me",
    asyncRouteHandler<IResponseUser>(async (request: IRequest) => {
      const user = request.getUserOrFail();
      const response = new ResponseUser(user);
      await response.unwindAll(request);

      return response;
    })
  )
  /**
   * @openapi
   * /users/{userId}:
   *   get:
   *     description: Returns user entry
   *     tags:
   *       - users
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the user entry
   *     responses:
   *       200:
   *         description: Returns IResponseUser object
   *         content:
   *           application/json:
   *             schema:
   *                 $ref: "#/components/schemas/IResponseUser"
   */
  .get(
    "/:userId",
    asyncRouteHandler<IResponseUser>(async (request: IRequest) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("userId has to be set");
      }

      const user = await User.findUserById(request.db.connection, userId);
      if (!user) {
        throw new UserDoesNotExits(`user ${userId} was not found`, userId);
      }

      const response = new ResponseUser(user);
      await response.unwindAll(request);

      return response;
    })
  )
  /**
   * @openapi
   * /users:
   *   get:
   *     description: Returns list of user entries
   *     tags:
   *       - users
   *     parameters:
   *       - in: query
   *         name: label
   *         schema:
   *           type: string
   *         required: true
   *         description: label filter
   *     responses:
   *       200:
   *         description: Returns list of IUser objects
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/IUser"
   */
  .get(
    "/",
    asyncRouteHandler<IUser[]>(async (request: IRequest) => {
      const label = (request.query.label as string) || "";

      if (!label) {
        return await User.findAllUsers(request.db.connection);
      } else if (label.length < 2) {
        return [];
      }
      return await User.findUsersByLabel(request.db.connection, label);
    })
  )
  /**
   * @openapi
   * /users:
   *   post:
   *     description: Create a new user entry
   *     tags:
   *       - users
   *     requestBody:
   *       description: User object
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/IUser"
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .post(
    "/",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const userData = request.body as IUser;

      // force empty password + active status
      delete userData.password;
      userData.active = true;

      const user = new User(userData);
      if (!user.isValid()) {
        throw new ModelNotValidError("invalid model");
      }

      await request.db.lock();

      if (!(await user.save(request.db.connection))) {
        throw new InternalServerError("cannot create user");
      }

      return {
        result: true,
      };
    })
  )
  /**
   * @openapi
   * /users/{userId}:
   *   put:
   *     description: Update an existing user entry
   *     tags:
   *       - users
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the user entry
   *     requestBody:
   *       description: User object
   *       content:
   *         application/json:
   *           schema:
   *             $ref: "#/components/schemas/IUser"
   *     responses:
   *       200:
   *         description: Returns generic response
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .put(
    "/:userId",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const userId =
        request.params.userId !== "me"
          ? request.params.userId
          : (request as any).user.user.id;
      const userData = request.body as IUser;

      if (!userId || !userData || Object.keys(userData).length === 0) {
        throw new BadParams("user id and data have to be set");
      }

      const existingUser = await User.findUserById(
        request.db.connection,
        userId
      );
      if (!existingUser) {
        throw new UserDoesNotExits(
          `user with id ${userId} does not exist`,
          userId
        );
      }

      if (!existingUser.canBeEditedByUser(request.getUserOrFail())) {
        throw new PermissionDeniedError("user cannot be saved");
      }

      if (userData.password) {
        userData.password = hashPassword(userData.password);
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
  /**
   * @openapi
   * /users/{userId}:
   *   delete:
   *     description: Removes the user entry
   *     tags:
   *       - users
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the user entry
   *     responses:
   *       200:
   *         description: Returns IResponseGeneric object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .delete(
    "/:userId",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("user id has to be set");
      }

      const existingUser = await User.findUserById(
        request.db.connection,
        userId
      );
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
  /**
   * @openapi
   * /users/active:
   *   patch:
   *     description: Validates the activation hash and switch user to active state
   *     tags:
   *       - users
   *     parameters:
   *       - in: query
   *         name: hash
   *         schema:
   *           type: string
   *         required: true
   *         description: Hash for identyfing the user for which this activation should be done
   *     responses:
   *       200:
   *         description: Returns IResponseGeneric object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .patch(
    "/active",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const hash = (request.query.hash as string) || "";
      if (!hash) {
        throw new BadParams("hash is required");
      }

      const existingUser = await User.getUserByHash(
        request.db.connection,
        hash
      );
      if (!existingUser) {
        throw new UserDoesNotExits(UserDoesNotExits.message, "");
      }

      const rawPassword = existingUser.generatePassword();

      const result = await existingUser.update(request.db.connection, {
        active: true,
        password: existingUser.password,
      });
      if (!result.replaced && !result.unchanged) {
        throw new InternalServerError(`cannot update user ${existingUser.id}`);
      }

      console.log(`User activated: ${existingUser.email}`);

      try {
        await mailer.sendTemplate(
          existingUser.email,
          passwordResetTemplate(existingUser.name, domainName(), rawPassword)
        );
      } catch (e) {
        throw new EmailError("please check the logs", (e as Error).toString());
      }

      return {
        result: true,
        message:
          "User activated. An email with the password has been sent to your email address",
      };
    })
  )
  /**
   * @openapi
   * /users/{userId}}/bookmarks:
   *   get:
   *     description: Returns list of bookmark folder entries for user
   *     tags:
   *       - users
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the user entry
   *     responses:
   *       200:
   *         description: Returns list of IResponseBookmarkFolder object
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/IResponseBookmarkFolder"
   */
  .get(
    "/:userId/bookmarks",
    asyncRouteHandler<IResponseBookmarkFolder[]>(async (request: IRequest) => {
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

      const user = await User.findUserById(request.db.connection, userId);
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
  /**
   * @openapi
   * /users/{userId}}/password:
   *   patch:
   *     description: Reset the password of given user + sends email with raw password to the user
   *     tags:
   *       - users
   *     parameters:
   *       - in: path
   *         name: userId
   *         schema:
   *           type: string
   *         required: true
   *         description: ID of the user entry or 'me' to identify the current user
   *     responses:
   *       200:
   *         description: Returns IResponseGeneric object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .patch(
    "/:userId/password",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const userId = request.params.userId;

      if (!userId) {
        throw new BadParams("userId has to be set");
      }

      let user: User | null;

      if (userId === "me") {
        user = request.getUserOrFail();
      } else {
        user = await User.findUserById(request.db.connection, userId);
      }

      if (!user) {
        throw new UserDoesNotExits(`user ${userId} was not found`, userId);
      }

      const rawPassword = user.generatePassword();
      const result = await user.update(request.db.connection, {
        password: user.password,
      });

      if (!result.replaced && !result.unchanged) {
        throw new InternalServerError(`cannot update user ${userId}`);
      }

      console.log(`Password reset for ${user.email}`);

      try {
        await mailer.sendTemplate(
          user.email,
          passwordResetTemplate(user.name, domainName(), rawPassword)
        );
      } catch (e) {
        throw new EmailError("please check the logs", (e as Error).toString());
      }

      return {
        result: true,
        message: `Email with the new password has been sent. Click to copy the new password: '${rawPassword}'.`,
        data: rawPassword,
      };
    })
  )
  /**
   * @openapi
   * /users/me/emails/test:
   *   get:
   *     description: Sends test email
   *     tags:
   *       - users
   *     parameters:
   *       - in: query
   *         name: email
   *         schema:
   *           type: string
   *         required: true
   *         description: email address
   *     responses:
   *       200:
   *         description: Returns IResponseGeneric object
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/IResponseGeneric"
   */
  .get(
    "/me/emails/test",
    asyncRouteHandler<IResponseGeneric>(async (request: IRequest) => {
      const user = request.getUserOrFail();
      const email = request.query.email as string;
      if (!email) {
        throw new BadParams("email has to be set");
      }

      try {
        await mailer.sendTemplate(email, testTemplate(domainName()));
      } catch (e) {
        throw new EmailError("please check the logs", (e as Error).toString());
      }

      return {
        result: true,
        message: `Test email sent to ${email}`,
      };
    })
  );
