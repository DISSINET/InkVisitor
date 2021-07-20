import { Response, Request, NextFunction } from "express";

class Acl {
  constructor() {
    this.authorize = this.authorize.bind(this);
    return;
  }

  public authorize(req: Request, res: Response, next: NextFunction): void {
    if (req.userId) {
      console.log(req.userId);
    }
    return next();
  }
}

export default Acl;
