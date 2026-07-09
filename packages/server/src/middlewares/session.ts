import cookieParser from "cookie-parser";
import session from "express-session";
import { sessionPool } from "./db";
import { RethinkSessionStore } from "@service/rethinkSessionStore";

const SESSION_MAX_AGE_MS =
  parseInt(process.env.SESSION_MAX_AGE || "", 10) || 86400000 * 30;

const sessionSecret = process.env.SECRET || "inkvisitor-dev-secret";

const sessionCookieSameSite =
  (process.env.SESSION_COOKIE_SAMESITE as "lax" | "strict" | "none" | undefined) ||
  "lax";

const sessionCookieSecure =
  process.env.HTTPS === "1" || process.env.NODE_ENV === "production";

export { sessionSecret };

export const sessionCookieName =
  process.env.SESSION_COOKIE_NAME ||
  `inkvisitor.sid.${process.env.ENV || "default"}`;

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
    secure: sessionCookieSecure,
    sameSite: sessionCookieSameSite,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
  },
});

export const cookieParserMiddleware = cookieParser();
