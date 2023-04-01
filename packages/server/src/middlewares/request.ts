import { InternalServerError, UserNotActiveError } from "@shared/types/errors";
import { Response, Request, NextFunction } from "express";
import User from "@models/user/user";

/**
 * Function checks if bound user variable is null and it either returns it or throws an error,
 * removing the need to use condition further in the code.
 * @param user
 * @returns
 */
const getUserOrFail = function (user: User | null): User {
  if (user) {
    return user;
  } else {
    throw new InternalServerError(
      "User is required for the action, but not set"
    );
  }
};

/**
 * Middleware that assigns current user getter to the request object.
 * The getter will trigger an error if called while the user object is empty.
 * This middleware should be therefore applied after the jwt middleware.
 * @param req
 * @param res
 * @param next
 */
export default async function customizeAuthenticatedRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let user: User | null = null;
  if (req.user && req.user.user) {
    user = await User.findUserById(req.db.connection, req.user.user.id);
    if (user && !user.active) {
      next(
        new UserNotActiveError(UserNotActiveError.message, req.user.user.email)
      );
    }
  }

  req.getUserOrFail = getUserOrFail.bind(undefined, user);

  next();
}
