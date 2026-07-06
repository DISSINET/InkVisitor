import { InternalServerError, UserNotActiveError } from "@inkvisitor/shared/types/errors";
import { Response, Request, NextFunction } from "express";
import User from "@models/user/user";

const getUserOrFail = function (user: User | null): User {
  if (user) {
    return user;
  } else {
    throw new InternalServerError(
      "User is required for the action, but not set"
    );
  }
};

export default async function customizeAuthenticatedRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let user: User | null = null;
  const userId = req.user?.user?.id;
  if (userId) {
    user = await User.findUserById(req.db.connection, userId);
    if (user && !user.active) {
      next(new UserNotActiveError(UserNotActiveError.message, user.email));
      return;
    }
  }

  req.getUserOrFail = getUserOrFail.bind(undefined, user);

  next();
}
