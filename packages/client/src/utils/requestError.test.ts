import { AxiosError, AxiosHeaders, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { formatRequestErrorDetails, readRequestError } from "./requestError";

const config = {
  method: "post",
  url: "/entities/E1",
  headers: new AxiosHeaders({ "x-inkvisitor-request-id": "req-1" }),
} as InternalAxiosRequestConfig;

const responseError = (status: number, data: unknown, code = AxiosError.ERR_BAD_RESPONSE) =>
  new AxiosError("failed", code, config, {}, {
    status,
    data,
    statusText: "",
    headers: {},
    config,
  } as AxiosResponse);

describe("readRequestError", () => {
  it("reads a request without a response as a lost connection", () => {
    const err = new AxiosError("Network Error", AxiosError.ERR_NETWORK, config, {});
    expect(readRequestError(err)).toEqual({
      signature: { error: "NetworkError", message: "" },
      reportable: false,
    });
  });

  it("reads a timeout as a timeout", () => {
    const err = new AxiosError("timeout", AxiosError.ECONNABORTED, config, {});
    expect(readRequestError(err).signature.error).toBe("TimeoutError");
  });

  it("keeps the request-too-large error for 413", () => {
    expect(readRequestError(responseError(413, "<html>")).signature.error).toBe(
      "RequestTooLargeError"
    );
  });

  it.each([502, 503, 504])("reads a proxy %i page as server unavailable", (status) => {
    expect(readRequestError(responseError(status, "<html>bad gateway</html>"))).toEqual({
      signature: { error: "ServerUnavailableError", message: "" },
      reportable: false,
    });
  });

  it("reads a non-JSON 500 body as server unavailable", () => {
    expect(readRequestError(responseError(500, "")).signature.error).toBe("ServerUnavailableError");
  });

  it("reads a non-JSON 4xx page as an unknown error with details", () => {
    const err = responseError(403, "<html>forbidden</html>", AxiosError.ERR_BAD_REQUEST);
    expect(readRequestError(err)).toEqual({
      signature: { error: "", message: "" },
      reportable: true,
    });
  });

  it("shows the error our server sent for a 5xx and offers its details", () => {
    const err = responseError(500, {
      result: false,
      error: "InternalServerError",
      message: "database timeout",
    });
    expect(readRequestError(err)).toEqual({
      signature: { error: "InternalServerError", message: "database timeout" },
      reportable: true,
    });
  });

  it("prefers our server's JSON error over the proxy reading of 503", () => {
    const err = responseError(503, {
      result: false,
      error: "GeocodingEngineUnconfiguredError",
      message: "",
    });
    expect(readRequestError(err).signature.error).toBe("GeocodingEngineUnconfiguredError");
  });

  it("reads a JSON 5xx without an error code as the generic server error", () => {
    expect(readRequestError(responseError(500, {})).signature.error).toBe("InternalServerError");
  });

  it("does not offer details for an error the user can act on", () => {
    const err = responseError(
      403,
      { result: false, error: "PermissionDeniedError", message: "" },
      AxiosError.ERR_BAD_REQUEST
    );
    expect(readRequestError(err).reportable).toBe(false);
  });

  it("offers details for an error code the client does not know", () => {
    const err = responseError(
      400,
      { result: false, error: "SomethingNew", message: "" },
      AxiosError.ERR_BAD_REQUEST
    );
    expect(readRequestError(err)).toEqual({
      signature: { error: "SomethingNew", message: "" },
      reportable: true,
    });
  });

  it("reads an error thrown by client code as a client error", () => {
    expect(readRequestError(new TypeError("x is undefined"))).toEqual({
      signature: { error: "ClientError", message: "" },
      reportable: true,
    });
  });
});

describe("formatRequestErrorDetails", () => {
  const now = new Date("2026-11-08T10:00:00.000Z");

  it("lists the request id, request and the error our server sent", () => {
    const err = responseError(500, {});
    const text = formatRequestErrorDetails(
      err,
      { error: "InternalServerError", message: "database timeout" },
      now,
      "https://example.org/inkvisitor/main"
    );
    expect(text).toBe(
      [
        "Time: 2026-11-08T10:00:00.000Z",
        "Request ID: req-1",
        "Request: POST /entities/E1",
        "Status: 500",
        "Error: InternalServerError",
        "Message: database timeout",
        "Page: https://example.org/inkvisitor/main",
      ].join("\n")
    );
  });

  it("adds the stack of an error thrown by client code", () => {
    const err = new TypeError("x is undefined");
    err.stack = "TypeError: x is undefined\n    at render";
    const text = formatRequestErrorDetails(err, { error: "ClientError", message: "" }, now, "/");
    expect(text).toContain("Message: x is undefined");
    expect(text).toContain("Stack: \nTypeError: x is undefined\n    at render");
  });
});
