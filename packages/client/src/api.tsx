import { EntityEnums } from "@shared/enums";
import {
  EntityTooltip,
  IAudit,
  IDocument,
  IEntity,
  IReference,
  IRequestQuery,
  IRequestStats,
  IResponseAudit,
  IResponseBackup,
  IResponseBookmarkFolder,
  IResponseDetail,
  IResponseEntity,
  IResponseGeneric,
  IResponsePermission,
  IPropSpec,
  IResponseQuery,
  IResponseStatement,
  IResponseStats,
  IResponseTerritory,
  IResponseTree,
  IResponseUser,
  IStatement,
  ITerritory,
  IUser,
  Query,
  Relation,
  RequestPermissionUpdate,
} from "@shared/types";
import * as errors from "@shared/types/errors";
import { Explore } from "@shared/types/query";
import { IRequestSearch } from "@shared/types/request-search";
import { ISetting, ISettingGroup } from "@shared/types/settings";
import { defaultPing } from "Theme/constants";
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { toast } from "react-toastify";
import io, { Socket } from "socket.io-client";
import {
  EntitiesDeleteErrorResponse,
  EntitiesDeleteSuccessResponse,
  RelationsCreateErrorResponse,
  RelationsCreateSuccessResponse,
} from "types";

interface IApiOptions extends AxiosRequestConfig<any> {
  ignoreErrorToast: boolean;
}

type IFilterUsers = {
  label?: string;
};

type IFilterDocuments = {
  documentIds?: string[];
};

const parseJwt = (token: string) => {
  var base64Url = token.split(".")[1];
  var base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  var jsonPayload = decodeURIComponent(
    atob(base64)
      .split("")
      .map(function (c) {
        return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join("")
  );
  try {
    return JSON.parse(jsonPayload);
  } catch {
    return false;
  }
};

class Api {
  private baseUrl: string;
  private apiUrl: string;
  private headers: object;
  private connection: AxiosInstance;
  // unique token key for each environment
  private tokenKey: string;
  private token: string;
  private ws?: Socket;
  private ping: number;

  private lastError: any = null;
  private errorTimeout: any;

  constructor() {
    this.baseUrl = process.env.APIURL || window.location.origin;
    this.apiUrl = this.baseUrl + "/api/v1";

    this.ping = defaultPing;

    this.headers = {
      "Content-Type": "application/json",
      //"Content-Encoding": "gzip",
    };

    this.connection = axios.create({
      baseURL: this.apiUrl,
      timeout: 15000,
      responseType: "json",
      headers: this.headers,
    });

    this.tokenKey = `${window.appConfig.env}-token`;
    this.token = "";
  }

  /**
   * Initializes websocket logic
   */
  initWs() {
    const url = new URL(this.baseUrl);

    this.ws = io(url.origin, {
      path: (url.pathname + "/socket.io").replace(`//`, "/"),
    });
    this.ws.on("connect", () => {
      console.log("Socket.IO connected");
    });
    this.ws.on("disconnect", () => {
      this.ping = -1;
      console.log("Socket.IO disconnected");
    });
    this.ws.on("error", (error) => {
      this.ping = -1;
      console.error("Socket error:", error);
    });
    this.ws.on("connect_error", (error) => {
      this.ping = -2;
      console.error("Socket connection error:", error);
    });
    this.ws.on("connect_timeout", () => {
      console.error("Socket connection timeout.");
    });

    setInterval(() => {
      const start = Date.now();

      (this.ws as Socket).emit("ping", (ack: any) => {
        if (ack instanceof Error) {
          console.error("Socket ping error:", ack);
        } else {
          const duration = Date.now() - start;
          this.ping = duration;
        }
      });
    }, 5000);
  }

  /**
   * Uses default request interceptors - mainly adding jwt token for requests
   */
  useDefaultRequestInterceptors() {
    // each request to api will be by default authorized
    this.connection.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${this.token}`;
      return config;
    });
  }

  /**
   * Proxies / overload pages often return HTML while the client uses responseType "json".
   * Axios then leaves the raw string in response.data (silent JSON parse). Callers assume
   * objects and crash — coerce that to a failed request instead.
   */
  private rejectIfNonJsonApiBody(response: AxiosResponse): AxiosResponse | Promise<never> {
    const rt = response.config?.responseType;
    if (rt === "blob" || rt === "arraybuffer" || rt === "document" || rt === "stream") {
      return response;
    }

    if (typeof response.data !== "string") {
      return response;
    }

    const ctRaw = response.headers?.["content-type"] ?? response.headers?.["Content-Type"] ?? "";
    const ct = String(ctRaw).toLowerCase();
    const trimmed = response.data.trimStart();
    const lowerHead = trimmed.slice(0, 16).toLowerCase();

    if (
      ct.includes("text/html") ||
      lowerHead.startsWith("<!doctype html") ||
      lowerHead.startsWith("<html") ||
      lowerHead.startsWith("<body") ||
      lowerHead.startsWith("<div")
    ) {
      toast.error(
        <div>
          Server returned HTML instead of JSON
          <p style={{ fontSize: "1rem" }}>
            This may indicate a service overload or missing database index
          </p>
        </div>
      );
      return Promise.reject(
        new AxiosError(
          "Server returned HTML instead of JSON (service may be overloaded or missing DB index).",
          AxiosError.ERR_BAD_RESPONSE,
          response.config,
          response.request,
          response
        )
      );
    }

    return response;
  }

  /**
   * Uses default response interceptors - mainly checking for error and shows the toaster
   */
  useDefaultResponseInterceptors() {
    this.connection.interceptors.response.use(
      (response) => {
        // Any status code that lie within the range of 2xx cause this function to trigger
        return this.rejectIfNonJsonApiBody(response);
      },
      (error: AxiosError) => {
        //@ts-ignore
        if (!error.config?.ignoreErrorToast) {
          // Any status codes that falls outside the range of 2xx cause this function to trigger
          // Do something with response error
          if (this.shouldShowErrorToast(error)) {
            this.showErrorToast(error);
          }
        }

        if (error.status === 401) {
          // Don't redirect on 401 for signin endpoint - let the login page handle the error
          const requestUrl = error.config?.url || "";
          const isSignInRequest = requestUrl.includes("/users/signin");

          if (!isSignInRequest) {
            // if handled by react router, then the toast could be visible
            window.location.pathname = (process.env.ROOT_URL || "") + "/login";
          }
        }

        return Promise.reject(error);
      }
    );
  }

  shouldShowErrorToast(error: any) {
    if (this.lastError && this.lastError.message === error.message) {
      // Same error as the last one, don't show the toast
      return false;
    }

    // Update the last error to the current error
    this.lastError = error;

    // Clear the previous timeout if it exists
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    this.errorTimeout = setTimeout(() => {
      this.lastError = null;
    }, 600);

    return true;
  }

  getPing() {
    return this.ping;
  }

  handleError = (err: any | AxiosError) => {
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 503) {
        return new errors.NetworkError();
      }
      const data = err.response?.data;
      if (typeof data === "string") {
        return new errors.NetworkError();
      }
      return data || new errors.NetworkError();
    } else {
      return new errors.NetworkError();
    }
  };

  responseToError(responseData: unknown): errors.IErrorSignature {
    const out: errors.IErrorSignature = {
      error: "",
      message: "",
    };

    const fillFromApiErrorPayload = (data: unknown): boolean => {
      if (
        data &&
        typeof data === "object" &&
        typeof (data as { error?: unknown }).error === "string"
      ) {
        out.error = (data as { error: string }).error;
        const msg = (data as { message?: unknown }).message;
        out.message = typeof msg === "string" ? msg : "";
        return true;
      }
      return false;
    };

    if (responseData instanceof AxiosError) {
      const ax = responseData;
      if (ax.code === AxiosError.ERR_NETWORK || ax.code === AxiosError.ERR_BAD_RESPONSE) {
        out.error = errors.NetworkError.TYPE;
        return out;
      }
      const d = ax.response?.data;
      if (typeof d === "string") {
        out.error = errors.NetworkError.TYPE;
        return out;
      }
      if (fillFromApiErrorPayload(d)) {
        return out;
      }
      return out;
    }

    const wrapped = responseData as { response?: { data?: unknown } } | null | undefined;
    const nested = wrapped?.response?.data;
    if (nested === undefined || nested === null) {
      return out;
    }
    if (typeof nested === "string") {
      out.error = errors.NetworkError.TYPE;
      return out;
    }
    fillFromApiErrorPayload(nested);
    return out;
  }

  showErrorToast(err: any) {
    const hydratedError = errors.getErrorByCode(this.responseToError(err));

    // delay is necessary to resolve toast duplicities before firing the toast
    setTimeout(() => {
      toast.error(
        <div>
          {hydratedError.title}
          {hydratedError.message ? (
            <p style={{ fontSize: "1rem" }}>{hydratedError.message}</p>
          ) : null}
        </div>
      );
    }, 50);
  }

  isLoggedIn = () => {
    let storedToken = localStorage.getItem(this.tokenKey);
    let storedUsername = localStorage.getItem("username");
    return storedToken && storedUsername ? true : false;
  };

  /**
   * Authentication
   */
  checkLogin() {
    let storedToken = localStorage.getItem(this.tokenKey);
    let storedUsername = localStorage.getItem("username");
    let storedUserId = localStorage.getItem("userid");

    if (!!storedToken && !!storedUsername && !!storedUserId) {
      const parsedToken = parseJwt(storedToken);

      if (parsedToken && Date.now() < parsedToken.exp * 1000) {
        const username = parsedToken.user.name;
        const userrole = parsedToken.user.role;
        this.saveLogin(storedToken, username, storedUserId, userrole);
      } else {
        this.signOut();
      }
    }
  }

  saveLogin(newToken: string, newUserName: string, newUserId: string, newUserRole: string) {
    localStorage.setItem(this.tokenKey, newToken);
    localStorage.setItem("username", newUserName);
    localStorage.setItem("userid", newUserId);
    localStorage.setItem("userrole", newUserRole);
    this.token = newToken;
  }

  /**
   * Clones the api wrapper with basic functionality without response interceptors
   * @returns Api
   */
  withoutToaster() {
    const newApi = new Api();
    newApi.token = this.token;
    newApi.useDefaultRequestInterceptors(); // required for login
    return newApi;
  }

  /** Development server only: GET /dev/simulate-html-error (HTML body, not JSON). */
  async devSimulateHtmlError(options?: IApiOptions): Promise<void> {
    const response = await this.connection.get("/dev/simulate-html-error", options);
    return response.data.filter((item: any) => item.name === "John");
  }

  async signIn(login: string, password: string, options?: IApiOptions): Promise<any> {
    try {
      const response = await this.connection.post(
        "/users/signin",
        {
          login,
          password,
        },
        options
      );

      if (response.status === 200) {
        const parsed = parseJwt(response.data.token);
        this.saveLogin(response.data.token, parsed.user.name, parsed.user.id, parsed.user.role);
        toast.success("Logged in");
      }
      return { ...response.data };
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async signOut() {
    localStorage.setItem(this.tokenKey, "");
    localStorage.setItem("username", "");

    this.token = "";
    // set global
  }

  /**
   * Users
   */

  async passwordChangeRequest(
    email: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/users/password_reset`,
        {
          email,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async passwordSetRequest(
    hash: string,
    password: string,
    passwordRepeat: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/users/password_reset?hash=${hash}`,
        {
          password,
          passwordRepeat,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async passwordResetExists(
    hash: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.get(`/users/password_reset?hash=${hash}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async usersGet(userId: string, options?: IApiOptions): Promise<AxiosResponse<IResponseUser>> {
    try {
      const response = await this.connection.get(`/users/${userId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async usersGetMore(
    filters: IFilterUsers,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseUser[]>> {
    try {
      const response = await this.connection.get(`/users?label=${filters.label || ""}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async usersCreate(
    userData: {
      email: string;
    },
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(`/users`, userData, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async usersUpdate(
    userId: string,
    changes: Partial<IUser>,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(`/users/${userId}`, changes, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async usersDelete(
    userId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(`/users/${userId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /*
    This request will restart the password of the user with userId and send the new password to his email address
  */
  async resetPassword(
    userId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.patch(`/users/${userId}/password`, undefined, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /*
    This request will update the password of the user represented by userId
    Optionally use "me" as placeholder for the userId
  */
  async updatePassword(
    userId: string,
    password: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/users/${userId}`,
        {
          password,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /*
    Same request as resetPassword, just using currenly logged user for specyfing the target
  */
  async resetMyPassword(): Promise<AxiosResponse<IResponseGeneric>> {
    return this.resetPassword("me");
  }

  /*
    This request will attempt to send test email to current user's email address
  */
  async testEmail(testEmail: string): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.get(`/users/me/emails/test?email=${testEmail}`);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Bookmarks
   * Bookmarks container
   */
  async bookmarksGet(
    userId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseBookmarkFolder[]>> {
    try {
      const response = await this.connection.get(`/users/${userId}/bookmarks`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Entities
   * Suggester container
   */
  async entityGet(
    entityId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseEntity>> {
    try {
      const response = await this.connection.get(`/entities/${entityId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async entitiesGet(
    entityIds: string[],
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseEntity[]>> {
    try {
      const response = await this.connection.post(`/entities/batch`, { ids: entityIds }, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async entitiesSearch(
    filter: IRequestSearch,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseEntity[]>> {
    try {
      if (!filter.class) {
        delete filter.class;
      }
      const response = await this.connection.get(`/entities`, {
        ...options,
        params: filter,
      });
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async entityCreate(
    newEntityData: IEntity | IStatement | ITerritory,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(`/entities`, newEntityData, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async entityClone(
    originalId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/entities/${originalId}/clone`,
        undefined,
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async entityUpdate(
    entityId: string,
    changes: Partial<IEntity>,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(`/entities/${entityId}`, changes, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async entityDelete(
    entityId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(`/entities/${entityId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async entitiesDelete(
    entityIds: string[],
    options?: IApiOptions
  ): Promise<(EntitiesDeleteSuccessResponse | EntitiesDeleteErrorResponse)[]> {
    const out: (EntitiesDeleteSuccessResponse | EntitiesDeleteErrorResponse)[] = [];
    try {
      const response = await this.connection.delete(`/entities/`, {
        data: {
          entityIds,
        },
        ...options,
      });
      const data = (response.data as IResponseGeneric<Record<string, errors.CustomError | true>>)
        .data;
      if (data) {
        for (const errorEntityId of Object.keys(data)) {
          if (data[errorEntityId] === true) {
            out.push({ entityId: errorEntityId, details: data[errorEntityId] });
          } else {
            out.push({
              entityId: errorEntityId,
              error: true,
              details: data[errorEntityId],
            });
          }
        }
      }
    } catch (err) {
      for (const entityId of entityIds) {
        out.push({
          error: true,
          message: `Failed to delete entity ${entityId}`,
          entityId: entityId,
          details: this.handleError(err),
        });
      }
    }

    return out;
  }

  async entityRestore(entityId: string): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(`/entities/${entityId}/restore`);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Detail
   * Detail container
   */
  async detailGet(
    entityId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseDetail>> {
    try {
      const response = await this.connection.get(`/entities/${entityId}/detail`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Tree
   * Tree container
   */
  async treeGet(options?: IApiOptions): Promise<AxiosResponse<IResponseTree>> {
    try {
      const response = await this.connection.get(`/tree`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Query
   */
  async query(
    queryData: IRequestQuery,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseQuery>> {
    try {
      const response = await this.connection.post(`/entities/query`, queryData, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }
  async queryExport(
    query: Query.INode,
    explore: Explore.IExplore,
    rowIndices: number[],
    options?: IApiOptions
  ): Promise<any> {
    try {
      const response = await this.connection.post(
        `/entities/query-export`,
        { query, explore, rowIndices },
        options
      );

      const tsvText = response.data.tsvText;

      const dateStamp = new Date().toLocaleString();
      let fileName = `query-${dateStamp}`;

      const blob = new Blob([tsvText], { type: "text/tab-separated-values" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = `${fileName}.tsv`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.log("err export", err);
      throw this.handleError(err);
    }
  }

  // this may include parent change
  async treeMoveTerritory(
    moveId: string,
    parentId: string,
    newIndex: number,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.patch(
        `/tree/${moveId}/position`,
        {
          parentId,
          newIndex,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Territory
   * List container
   */
  async territoryGet(
    territoryId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseTerritory>> {
    try {
      const response = await this.connection.get(
        `/territories/${territoryId}?preload=1&warnings=1`,
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Territory
   * List statements
   */
  async territoryGetStatements(
    territoryId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseStatement[]>> {
    try {
      const response = await this.connection.get(`/territories/${territoryId}/statements`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * entityIdsInTerritory retieves ids of statements that are used on the territory
   * @see Statement.findDependentStatementIds
   */
  async entityIdsInTerritory(
    territoryId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<string[]>> {
    try {
      const response = await this.connection.get(`/territories/${territoryId}/entities`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async territoriesCopy(
    territoryId: string,
    targets: string[],
    withChildren: boolean,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/territories/${territoryId}/copy`,
        {
          targets,
          withChildren,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Tooltips
   */

  async tooltipGet(
    entityId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<EntityTooltip.IResponse>> {
    try {
      const response = await this.connection.get(`/entities/${entityId}/tooltip`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Stats
   */
  async statsGet(
    data: IRequestStats,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseStats>> {
    try {
      const response = await this.connection.post(`/stats`, data, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Stats Materialized
   */
  async statsMaterializedGet(
    data: IRequestStats,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseStats>> {
    try {
      const response = await this.connection.post(`/stats/materialized`, data, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Stats Aggregate - Manual aggregation trigger
   */
  async statsAggregate(
    data: {
      fromDate: number;
      toDate: number;
      timeUnits?: string[];
      aggregateBy?: string[];
    },
    options?: IApiOptions
  ): Promise<AxiosResponse<{ message: string; recordsProcessed: number }>> {
    try {
      const response = await this.connection.post(`/stats/aggregate`, data, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Backups
   * Lists all available DB backup archives (admin/owner only).
   */
  async backupsGet(options?: IApiOptions): Promise<AxiosResponse<IResponseBackup[]>> {
    try {
      const response = await this.connection.get(`/backups`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Downloads a single backup archive and triggers a browser download.
   * @param backupId relative archive id from backupsGet, e.g. "20240101/inkvisitor_backup.tar.gz"
   * @param fileName optional override for the downloaded file name
   */
  async backupDownload(backupId: string, fileName?: string): Promise<void> {
    try {
      const response = await this.connection.get(`/backups/download`, {
        params: { file: backupId },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");

      a.href = url;
      a.download = fileName || backupId.replace(/\//g, "_");
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Audit
   */
  async auditGet(entityId: string, options?: IApiOptions): Promise<AxiosResponse<IResponseAudit>> {
    try {
      const response = await this.connection.get(`/entities/${entityId}/audits`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Document audits response: IResponseAudit
   * - modelId: documentId
   * - auditScope: "document"
   * - last: IAudit[] (up to noAudits most recent, default 5)
   * - first?: IAudit (oldest, if any)
   *
   * Each IAudit when auditScope is document:
   * - id, modelId, auditScope, user, date, type: EventType
   * - changes: IDocumentAuditAnchorChanges
   *   - changes: { anchor: string, occurrence: number }[]  (anchors whose content was edited)
   *   - additions: { anchor: string, occurrence: number }[]
   *   - removals: { anchor: string, occurrence: number }[]
   */
  async auditGetByDocument(
    documentId: string,
    noAudits = 5,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseAudit>> {
    try {
      const response = await this.connection.get(`/documents/${documentId}/audits`, {
        ...options,
        params: {
          ...(options?.params as Record<string, unknown>),
          noAudits,
        },
      });
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async auditGetFirst(options?: IApiOptions): Promise<AxiosResponse<IResponseGeneric<IAudit>>> {
    try {
      const response = await this.connection.get(`/audits?skip=0&take=1&from=1970`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Statement
   * Editor container
   */
  async statementGet(
    statementId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseStatement>> {
    try {
      const response = await this.connection.get(`/statements/${statementId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async statementsBatchMove(
    statementsIds: string[],
    territoryId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/statements/batch-move?ids=${statementsIds.join(",")}`,
        {
          territoryId,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async statementsBatchCopy(
    statementsIds: string[],
    territoryId?: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      if (!territoryId) {
        if (!statementsIds.length) {
          throw new Error("No statements to duplicate");
        }

        let lastResponse: AxiosResponse<IResponseGeneric> | undefined;
        let failureCount = 0;
        const cloneOpts: IApiOptions = {
          ...options,
          ignoreErrorToast: options?.ignoreErrorToast ?? true,
        };

        for (const statementId of statementsIds) {
          try {
            lastResponse = await this.entityClone(statementId, cloneOpts);
          } catch {
            failureCount++;
          }
        }

        // attach failure count to last response
        const taggedLast = lastResponse as AxiosResponse<IResponseGeneric> & {
          incompleteCloneFailures?: number;
        };

        if (taggedLast) {
          taggedLast.incompleteCloneFailures = failureCount;
        }

        // show toast if some statements could not be duplicated
        if (failureCount > 0) {
          const failedLabel = failureCount === 1 ? "statement" : "statements";
          toast.warning(
            failureCount === statementsIds.length
              ? `${failureCount} ${failedLabel} could not be duplicated.`
              : `Some statements could not be duplicated (${failureCount} of ${statementsIds.length}).`
          );
          if (!lastResponse) {
            throw new Error(`All statement duplicates failed (${failureCount}).`);
          }
        }

        return lastResponse as AxiosResponse<IResponseGeneric>;
      }

      const response = await this.connection.post(
        `/statements/batch-copy?ids=${statementsIds.join(",")}`,
        {
          territoryId,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async statementsBatchReorder(
    updates: { id: string; order: number }[],
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/statements/batch-reorder`,
        {
          updates,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async statementsReferencesReplace(
    statementsIds: string[],
    references: IReference[],
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/statements/references?ids=${statementsIds.join(",")}&replace=true`,
        references,
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async statementsReferencesAppend(
    statementsIds: string[],
    references: IReference[],
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/statements/references?ids=${statementsIds.join(",")}`,
        references,
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Pernmissions
   */

  async getAclPermissions(options?: IApiOptions): Promise<AxiosResponse<IResponsePermission[]>> {
    try {
      const response = await this.connection.get(`/acls`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async updatePermission(
    permissionId: string,
    data: RequestPermissionUpdate,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(`/acls/${permissionId}`, data, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async activation(
    hash: string,
    password: string,
    passwordRepeat: string,
    username: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/users/activation?hash=${hash}`,
        {
          password,
          passwordRepeat,
          username,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async activationExists(
    hash: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.get(`/users/activation?hash=${hash}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Relations
   */
  async relationUpdate(
    relationId: string,
    changes: Partial<Relation.IRelation>,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(`/relations/${relationId}`, changes, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async relationCreate(
    newRelation: Relation.IRelation,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(`/relations`, newRelation, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async relationsCreate(
    newRelations: Relation.IRelation[],
    options?: IApiOptions
  ): Promise<(RelationsCreateSuccessResponse | RelationsCreateErrorResponse)[]> {
    const out = [];

    for (const newRelation of newRelations) {
      try {
        const response = await this.connection.post(`/relations`, newRelation, options);
        out.push({ relation: newRelation, details: response });
      } catch (err) {
        out.push({
          error: true,
          message: `Failed to create relation ${newRelation.id}`,
          relation: newRelation,
          details: this.handleError(err),
        });
      }
    }

    return out;
  }

  async relationDelete(
    relationId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(`/relations/${relationId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Document
   */

  async documentsGet(
    filter: IFilterDocuments,
    options?: IApiOptions
  ): Promise<AxiosResponse<IDocument[]>> {
    try {
      const response = await this.connection.get(`/documents/`, {
        ...options,
        params: filter,
      });
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async documentGet(documentId: string, options?: IApiOptions): Promise<AxiosResponse<IDocument>> {
    try {
      const response = await this.connection.get(`/documents/${documentId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async documentDelete(
    documentId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IDocument>> {
    try {
      const response = await this.connection.delete(`/documents/${documentId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async documentUpload(
    document: Partial<IDocument>,
    options?: IApiOptions
  ): Promise<AxiosResponse<IDocument>> {
    try {
      const response = await this.connection.post(`/documents`, document, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async documentExport(
    documentId: string,
    exportedEntities: EntityEnums.Class[],
    fileName: string
  ): Promise<any> {
    try {
      const response = await this.connection.post(
        `/documents/export`,
        {
          documentId,
          exportedEntities,
        },
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement("a");

      a.href = url;
      a.download = `${fileName}.txt`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async documentGetAnchorText(
    documentId: string,
    entityId: string,
    anchorIndex: number,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric<string>>> {
    try {
      const response = await this.connection.get(
        `/documents/${documentId}/anchors?entityId=${entityId}&index=${anchorIndex}`,
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async documentRemoveAnchors(
    documentId: string,
    // can be both single string or array of strings
    entityIds: string[] | string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.patch(
        `/documents/${documentId}/removeAnchors?entityId=${entityIds}`,
        undefined,
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async documentRemoveAnchor(
    documentId: string,
    entityId: string,
    anchorIndex: number,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.patch(
        `/documents/${documentId}/removeAnchor`,
        {
          entityId,
          anchorIndex,
        },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Document update
   */
  async documentUpdate(
    documentId: string,
    document: Partial<IDocument>,
    options?: IApiOptions
  ): Promise<AxiosResponse<IDocument>> {
    try {
      const response = await this.connection.put(`/documents/${documentId}`, document, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Setting get
   * @param settingId
   * @param options
   * @returns
   */
  async settingGet(
    settingId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric<ISetting>>> {
    try {
      const response = await this.connection.get(`/settings/${settingId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Setting group get
   * @param settingId
   * @param options
   * @returns
   */
  async settingGroupGet(
    settingGroupId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric<ISettingGroup>>> {
    try {
      const response = await this.connection.get(`/settings/group/${settingGroupId}`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Setting group get
   * @param settingId
   * @param data
   * @param options
   * @returns
   */
  async settingGroupUpdate(
    settingGroupId: string,
    data: { id: string; value: unknown }[],
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric<ISettingGroup>>> {
    try {
      const response = await this.connection.put(
        `/settings/group/${settingGroupId}`,
        data,
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Setting update
   * @param settingId
   * @param data
   * @param options
   * @returns
   */
  async settingUpdate(
    settingId: string,
    data: { value: unknown },
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(`/settings/${settingId}`, data, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  /**
   * Get owner's info
   * @param settingId
   * @param options
   * @returns
   */
  async usersGetOwner(options?: IApiOptions): Promise<AxiosResponse<IResponseGeneric<string>>> {
    try {
      const response = await this.connection.get(`/users/owner`, options);
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async batchEntityAddMetaprop(
    entityIds: string[],
    propData: {
      logic: EntityEnums.Logic;
      certainty: EntityEnums.Certainty;
      mood: EntityEnums.Mood[];
      moodvariant: EntityEnums.MoodVariant;
      type: IPropSpec;
      value: IPropSpec;
    },
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/entities/batchAddMetaprop`,
        { entityIds, propData },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }

  async batchEntityAddReference(
    entityIds: string[],
    resourceEntityId: string,
    valueEntityId?: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/entities/batchAddReference`,
        { entityIds, resourceEntityId, valueEntityId },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }
  async batchEntityAddRelation(
    entityIds: string[],
    relationType: string,
    targetEntityId: string,
    options?: IApiOptions
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/entities/batchAddRelation`,
        { entityIds, relationType, targetEntityId },
        options
      );
      return response;
    } catch (err) {
      throw this.handleError(err);
    }
  }
}

const apiSingleton = new Api();
apiSingleton.initWs();
apiSingleton.checkLogin();
apiSingleton.useDefaultRequestInterceptors();
apiSingleton.useDefaultResponseInterceptors();

export default apiSingleton;
