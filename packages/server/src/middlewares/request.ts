import { InternalServerError } from "@shared/types/errors";
import { Response, Request, NextFunction } from "express";
import User from "@models/user";

// todo this can be optimized
export default async function customizeRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  let user: User | null;
  if (req.user && req.user.user) {
    user = await User.getUser(req.db.connection, req.user.user.id);
  }

  req.getUserOrFail = function (): User {
    if (user) {
      return user;
    } else {
      throw new InternalServerError(
        "User is required for the action, but not set"
      );
    }
  };

  next();
}
