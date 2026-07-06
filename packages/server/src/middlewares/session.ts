import cookieParser from "cookie-parser";
import session from "express-session";
import { sessionPool } from "./db";
import { RethinkSessionStore } from "@service/rethinkSessionStore";

const SESSION_MAX_AGE_MS =
  parseInt(process.env.SESSION_MAX_AGE || "", 10) || 86400000 * 30;

const sessionSecret =
  process.env.SESSION_SECRET || process.env.SECRET || "inkvisitor-dev-secret";

export { sessionSecret };

export const sessionCookieName = "inkvisitor.sid";

export const sessionStore = new RethinkSessionStore(sessionPool);

export const sessionMiddleware = session({
  name: sessionCookieName,
  secret: sessionSecret,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
  },
});

export const cookieParserMiddleware = cookieParser();
