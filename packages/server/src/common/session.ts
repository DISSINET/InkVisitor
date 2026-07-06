import { Request } from "express";

export function createSessionUserId(
  req: Request,
  userId: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const regenerate = req.session.regenerate.bind(req.session);
    regenerate((err) => {
      if (err) {
        reject(err);
        return;
      }
      req.session.userId = userId;
      req.session.save((saveErr) => {
        if (saveErr) {
          reject(saveErr);
          return;
        }
        resolve();
      });
    });
  });
}

export function destroySession(req: Request): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.destroy((err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}
