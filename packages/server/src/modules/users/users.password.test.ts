import { testErroneousResponse } from "@modules/common.test";
import { UserDoesNotExits } from "@shared/types/errors";
import request, { Response } from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import mailer, { EmailSubject } from "@service/mailer";
import { Db } from "@service/rethink";
import User from "@models/user/user";
import { checkPassword } from "@common/auth";
import { IResponseGeneric } from "@shared/types";
import { pool } from "@middlewares/db";

describe("Users password", function () {
  const db = new Db();

  beforeAll(async () => {
    await db.initDb();
  });

  afterAll(async () => {
    await db.close();
    await pool.end();
  });

  describe("invalid user", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      await request(app)
        .patch(`${apiPath}/users/random/password`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(
          testErroneousResponse.bind(
            undefined,
            new UserDoesNotExits("", "random")
          )
        );
    });
  });

  describe("me", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      await request(app)
        .patch(`${apiPath}/users/me/password`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .then(async () => {
          expect(mailer.lastEmailSubject).toBe(EmailSubject.PasswordReset);
          const user = await User.findUserByLabel(
            db.connection,
            supertestConfig.username
          );
          expect(user).not.toBeNull();
          if (user) {
            expect(
              checkPassword(
                mailer.lastEmailData.rawPassword,
                user.password || ""
              )
            ).toBeTruthy();
          }
        });
    });
  });

  describe("new user", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async () => {
      const newUsername = "test" + Math.random().toString();
      const user = new User({ name: newUsername });
      await user.save(db.connection);

      await request(app)
        .patch(`${apiPath}/users/me/password`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .then(async (response: Response) => {
          const body = response.body as IResponseGeneric;

          expect(mailer.lastEmailSubject).toBe(EmailSubject.PasswordReset);

          const user = await User.findUserByLabel(
            db.connection,
            supertestConfig.username
          );
          expect(user).not.toBeNull();
          if (user) {
            expect(
              checkPassword(body.data as string, user.password || "")
            ).toBeTruthy();
          }
        });
    });
  });
});
