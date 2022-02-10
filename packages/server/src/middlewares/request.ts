import { InternalServerError } from "@shared/types/errors";
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

export default async function customizeRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let user: User | null = null;
  if (req.user && req.user.user) {
    user = await User.getUser(req.db.connection, req.user.user.id);
  }

  req.getUserOrFail = getUserOrFail.bind(undefined, user);

  next();
}
