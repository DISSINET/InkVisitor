import { Request, Response } from "express";
import { BadParams, InternalServerError } from "@inkvisitor/shared/types/errors";
import errorsMiddleware from "./errors";

const run = (err: Error, requestId?: string) => {
  const req = {
    header: (name: string) => (name === "x-inkvisitor-request-id" ? requestId : undefined),
  } as unknown as Request;
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  errorsMiddleware(err, req, res as unknown as Response, jest.fn());
  return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

describe("errorsMiddleware", () => {
  let logged: string[];

  beforeEach(() => {
    logged = [];
    jest.spyOn(console, "error").mockImplementation((...args) => {
      logged.push(args.map(String).join(" "));
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("answers an unhandled error with the generic server error and logs it", () => {
    const { status, body } = run(new TypeError("secret is undefined"), "req-1");

    expect(status).toBe(500);
    expect(body).toEqual({
      result: false,
      error: "InternalServerError",
      message: InternalServerError.message,
    });
    expect(logged.some((line) => line.includes("[request req-1] secret is undefined"))).toBe(true);
  });

  it("answers a custom error with its own message", () => {
    const { status, body } = run(new BadParams("label is missing"));

    expect(status).toBe(400);
    expect(body).toEqual({ result: false, error: "BadParams", message: "label is missing" });
  });

  it("logs a loggable error with its request id", () => {
    run(new InternalServerError("database timeout"), "req-2");

    expect(logged.some((line) => line.includes("[request req-2] InternalServerError"))).toBe(true);
  });

  it("leaves a request id that is not a plain token out of the log", () => {
    run(new TypeError("boom"), "req 3 injected");

    expect(logged.some((line) => line.includes("[request"))).toBe(false);
  });
});
