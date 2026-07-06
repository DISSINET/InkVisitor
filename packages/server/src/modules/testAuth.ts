import request from "supertest";
import { sign } from "cookie-signature";
import { randomBytes } from "crypto";
import session from "express-session";
import { apiPath } from "@common/constants";
import app from "../server";
import {
  sessionCookieName,
  sessionSecret,
  sessionStore,
} from "@middlewares/session";

export type AuthAgent = ReturnType<typeof request.agent>;

export const testCredentials = {
  login: "admin",
  password: "admin",
};

export async function getAuthenticatedAgent(
  login = testCredentials.login,
  password = testCredentials.password
): Promise<AuthAgent> {
  const agent = request.agent(app);
  await agent
    .post(`${apiPath}/users/signin`)
    .send({ login, password })
    .expect(200);
  return agent;
}

export async function createAgentWithUserId(userId: string): Promise<AuthAgent> {
  const sid = randomBytes(24).toString("hex");
  await new Promise<void>((resolve, reject) => {
    sessionStore.set(
      sid,
      {
        cookie: {
          maxAge: 86400000,
          originalMaxAge: 86400000,
          httpOnly: true,
          path: "/",
        },
        userId,
      } as session.SessionData,
      (err) => (err ? reject(err) : resolve())
    );
  });

  const agent = request.agent(app);
  const signedSid = `s:${sign(sid, sessionSecret)}`;
  await agent
    .get(`${apiPath}/health`)
    .set("Cookie", `${sessionCookieName}=${signedSid}`);
  return agent;
}
