import { getOneActant, Result } from "../index";
import { rethinkConfig } from "@service/RethinkDB";
import { paramMissingError } from "@common/constants";
import { NextFunction, Request, Response } from "express";
import { Router } from "express";
import { BAD_REQUEST, CREATED, NOT_FOUND, OK } from "http-status-codes";
import { r } from "rethinkdb-ts";
import { findUserByName } from "@service/shorthands";
import { BadCredentialsError, UserDoesNotExits } from "@common/errors";
import { checkPassword, generateAccessToken } from "@common/auth";
//-----------------------------------------------------------------------------
// Router
//-----------------------------------------------------------------------------

export default Router().post(
  "/signin",
  async (request: Request, response: Response) => {
    const name = request.body.username;
    const rawPassword = request.body.password;
    console.log("user is signing in", name, rawPassword);

    const user = await findUserByName(request.db, name);
    if (!user) {
      throw new UserDoesNotExits(`user ${name} was not found`);
    }

    if (!checkPassword(rawPassword, user.password || "")) {
      throw new BadCredentialsError("unknown credentials");
    }

    user.password = undefined;

    response.json({
      token: generateAccessToken(user),
    });
  }
);
