import { newMockRequest, testErroneousResponse } from "@modules/common.test";
import { BadParams, UserDoesNotExits } from "@shared/types/errors";
import request, { Response } from "supertest";
import { apiPath } from "@common/constants";
import app from "../../Server";
import { supertestConfig } from "..";
import mailer, { EmailSubject } from "@service/mailer";
import { createConnection, Db } from "@service/RethinkDB";
import User from "@models/user/user";
import { checkPassword } from "@common/auth";
import { IResponseGeneric } from "@shared/types";

describe("Users password", function () {
  describe("invalid user", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", (done) => {
      return request(app)
        .patch(`${apiPath}/users/random/password`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(testErroneousResponse.bind(undefined, new UserDoesNotExits("", "random")))
        .then(() => done());
    });
  });

  describe("me", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", () => {
      return request(app)
        .patch(`${apiPath}/users/me/password`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .then(async () => {
          expect(mailer.lastEmailSubject).toBe(EmailSubject.PasswordReset);
          const req = newMockRequest(new Db());
          await createConnection(req);

          const user = await User.findUserByLabel(req.db.connection, supertestConfig.username);
          expect(user).not.toBeNull();
          if (user) {
            expect(checkPassword(mailer.lastEmailData.rawPassword, user.password || "")).toBeTruthy();
          }

          await req.db.close();
        });
    });
  });

  describe("new user", () => {
    it("should return a UserDoesNotExits error wrapped in IResponseGeneric", async (done) => {
      const req = newMockRequest(new Db());
      await createConnection(req);

      const newUsername = "test" + Math.random().toString();
      const user = new User({ name: newUsername });
      await user.save(req.db.connection);

      await request(app)
        .patch(`${apiPath}/users/me/password`)
        .set("authorization", "Bearer " + supertestConfig.token)
        .expect("Content-Type", /json/)
        .expect(200)
        .then(async (response: Response) => {
          const body = response.body as IResponseGeneric;

          expect(mailer.lastEmailSubject).toBe(EmailSubject.PasswordReset);

          const user = await User.findUserByLabel(req.db.connection, supertestConfig.username);
          expect(user).not.toBeNull();
          if (user) {
            expect(checkPassword(body.data as string, user.password || "")).toBeTruthy();
          }
        });

      await req.db.close();
      done();
    });
  });
});