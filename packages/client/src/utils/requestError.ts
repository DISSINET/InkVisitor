import * as errors from "@inkvisitor/shared/types/errors";
import { AxiosError } from "axios";

export interface IRequestErrorReading {
  signature: errors.IErrorSignature;
  // the server failed in a way only its log explains, so the user is offered
  // details to send to the project owner
  reportable: boolean;
}

// statuses a reverse proxy answers with when the API behind it is down or slow
const PROXY_STATUSES = [502, 503, 504];

export const readApiErrorPayload = (data: unknown): errors.IErrorSignature | null => {
  if (data && typeof data === "object" && typeof (data as { error?: unknown }).error === "string") {
    const message = (data as { message?: unknown }).message;
    return {
      error: (data as { error: string }).error,
      message: typeof message === "string" ? message : "",
    };
  }
  return null;
};

/**
 * Decides which error a failed request is shown as. Our server always answers
 * with a JSON body carrying an `error` code, so a response without one came
 * from a proxy in front of it.
 */
export const readRequestError = (err: unknown): IRequestErrorReading => {
  const read = (error: string, message = "", reportable = false): IRequestErrorReading => ({
    signature: { error, message },
    reportable,
  });

  if (!(err instanceof AxiosError)) {
    return read(errors.ClientError.TYPE, "", true);
  }
  if (err.code === AxiosError.ECONNABORTED || err.code === AxiosError.ETIMEDOUT) {
    return read(errors.TimeoutError.TYPE);
  }
  if (!err.response) {
    return read(errors.NetworkError.TYPE);
  }

  const { status, data } = err.response;
  if (status === 413) {
    return read(errors.RequestTooLargeError.TYPE);
  }

  const payload = readApiErrorPayload(data);
  if (payload) {
    const reportable = status >= 500 || !errors.isKnownErrorCode(payload.error);
    return read(payload.error, payload.message, reportable);
  }
  const isJson = typeof data === "object" && data !== null;
  if (PROXY_STATUSES.includes(status) || (!isJson && status >= 500)) {
    return read(errors.ServerUnavailableError.TYPE);
  }
  if (status >= 500) {
    return read(errors.InternalServerError.TYPE, "", true);
  }
  return read("", "", true);
};

/**
 * Plain text the user pastes into a message to the project owner. The request
 * id matches the line the server logged with the full error.
 */
export const formatRequestErrorDetails = (
  err: unknown,
  signature: errors.IErrorSignature,
  now: Date,
  page: string
): string => {
  const lines: [string, unknown][] = [["Time", now.toISOString()]];

  if (err instanceof AxiosError) {
    const config = err.config;
    lines.push(["Request ID", config?.headers?.["x-inkvisitor-request-id"]]);
    if (config) {
      lines.push(["Request", `${(config.method || "get").toUpperCase()} ${config.url || ""}`]);
    }
    lines.push(["Status", err.response?.status]);
  }

  lines.push(["Error", signature.error || "unknown"]);
  lines.push(["Message", signature.message || (err instanceof Error ? err.message : "")]);
  lines.push(["Page", page]);
  if (!(err instanceof AxiosError) && err instanceof Error && err.stack) {
    lines.push(["Stack", `\n${err.stack}`]);
  }

  return lines
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
};
