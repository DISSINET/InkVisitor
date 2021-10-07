import { IUser } from "@shared/types";
import { InternalServerError } from "@shared/types/errors";
import { Response, Request, NextFunction } from "express";

export default function customizeRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  req.getUserOrFail = function (): IUser {
    if (req.user && req.user.user) {
      return req.user.user;
    } else {
      throw new InternalServerError(
        "User is required for the action, but not set"
      );
    }
  };
  next();
}
