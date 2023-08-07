import {
  IEntity,
  IResponseEntity,
  IResponseAdministration,
  IResponseAudit,
  IResponseBookmarkFolder,
  IResponseDetail,
  IResponseGeneric,
  IResponsePermission,
  IResponseStatement,
  IResponseTerritory,
  IResponseTree,
  IResponseUser,
  RequestPermissionUpdate,
  IStatement,
  ITerritory,
  Relation,
  EntityTooltip,
  IReference,
  IResponseDocument,
  IDocument,
  IResponseDocumentDetail,
} from "@shared/types";
import * as errors from "@shared/types/errors";
import { IRequestSearch } from "@shared/types/request-search";
import { defaultPing } from "Theme/constants";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import React from "react";
import { toast } from "react-toastify";
import io, { Socket } from "socket.io-client";

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
  private apiUrl: string;
  private headers: object;
  private connection: AxiosInstance;
  private token: string;
  private ws: Socket;
  private ping: number;

  constructor() {
    if (!process.env.APIURL) {
      throw new Error("APIURL is not set");
    }

    const baseUrl = process.env.APIURL;
    this.apiUrl = baseUrl + "/api/v1";

    this.ping = defaultPing;

    const url = new URL(baseUrl);

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
      console.error("Socket connection error:", error);
    });
    this.ws.on("connect_timeout", () => {
      console.error("Socket connection timeout.");
    });

    setInterval(() => {
      const start = Date.now();

      this.ws.emit("ping", (ack: any) => {
        if (ack instanceof Error) {
          console.error("Socket ping error:", ack);
        } else {
          const duration = Date.now() - start;
          this.ping = duration;
        }
      });
    }, 5000);

    this.headers = {
      "Content-Type": "application/json",
      //"Content-Encoding": "gzip",
    };

    this.connection = axios.create({
      baseURL: this.apiUrl,
      timeout: 8000,
      responseType: "json",
      headers: this.headers,
    });

    // each request to api will be by default authorized
    this.connection.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${this.token}`;
      return config;
    });

    this.connection.interceptors.response.use(
      function (response) {
        // Any status code that lie within the range of 2xx cause this function to trigger
        // Do something with response data
        return response;
      },
      (error) => {
        // Any status codes that falls outside the range of 2xx cause this function to trigger
        // Do something with response error
        this.showErrorToast(error);
        return Promise.reject(error);
      }
    );

    this.token = "";
    this.checkLogin();
  }

  getPing() {
    return this.ping;
  }

  responseToError(responseData: unknown): errors.IErrorSignature {
    const out = {
      error: "",
      message: "",
    };

    if (responseData && typeof responseData === "object") {
      out.error = (responseData as Record<string, string>).error;
      out.message = (responseData as Record<string, string>).message;
    }

    return out;
  }

  showErrorToast(err: any) {
    const hydratedError = errors.getErrorByCode(
      this.responseToError(err.response?.data)
    );

    toast.error(
      <div>
        {hydratedError.title}
        {hydratedError.message ? (
          <p style={{ fontSize: "1rem" }}>{hydratedError.message}</p>
        ) : null}
      </div>
    );
  }

  isLoggedIn = () => {
    let storedToken = localStorage.getItem("token");
    let storedUsername = localStorage.getItem("username");
    return storedToken && storedUsername ? true : false;
    // return {username: storedUsername ,token: storedToken};
  };

  /**
   * Authentication
   */

  checkLogin() {
    let storedToken = localStorage.getItem("token");
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

  saveLogin(
    newToken: string,
    newUserName: string,
    newUserId: string,
    newUserRole: string
  ) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("username", newUserName);
    localStorage.setItem("userid", newUserId);
    localStorage.setItem("userrole", newUserRole);
    this.token = newToken;
  }

  async signIn(username: string, password: string): Promise<any> {
    try {
      const response = (await this.connection.post(
        "/users/signin",
        {
          username: username,
          password: password,
        },
        {}
      )) as AxiosResponse;

      if (response.status === 200) {
        const parsed = parseJwt(response.data.token);
        this.saveLogin(
          response.data.token,
          parsed.user.name,
          parsed.user.id,
          parsed.user.role
        );
        toast.success("Logged in");
      }
      return { ...response.data };
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async signOut() {
    localStorage.setItem("token", "");
    localStorage.setItem("username", "");

    this.token = "";
    // set global
  }

  /**
   * Users
   */

  async usersGet(userId: string): Promise<AxiosResponse<IResponseUser>> {
    try {
      const response = await this.connection.get(`/users/${userId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async usersGetMore(
    filters: IFilterUsers
  ): Promise<AxiosResponse<IResponseUser[]>> {
    try {
      const response = await this.connection.get(
        `/users?label=${filters.label}`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async usersCreate(userData: {
    name: string;
    email: string;
  }): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(`/users`, userData);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async usersUpdate(
    userId: string,
    changes: object
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(`/users/${userId}`, changes);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async usersDelete(userId: string): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(`/users/${userId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /*
    This request will restart the password of the user with userId and send the new password to his email address
  */
  async resetPassword(
    userId: string
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.patch(`/users/${userId}/password`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }


  /*
    This request will update the password of the user represented by userId
    Optionally use "me" as placeholder for the userId
  */
  async updatePassword(
    userId: string,
    password: string,
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(`/users/${userId}`, {
        password
      });
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
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
      const response = await this.connection.get(
        `/users/me/emails/test?email=${testEmail}`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Administration
   * Administration container
   */
  async administrationGet(): Promise<AxiosResponse<IResponseAdministration>> {
    try {
      const response = await this.connection.get(`/users/administration`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Bookmarks
   * Bookmarks container
   */
  async bookmarksGet(
    userId: string
  ): Promise<AxiosResponse<IResponseBookmarkFolder[]>> {
    try {
      const response = await this.connection.get(`/users/${userId}/bookmarks`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Entities
   * Suggester container
   */
  async entitiesGet(entityId: string): Promise<AxiosResponse<IResponseEntity>> {
    try {
      const response = await this.connection.get(`/entities/${entityId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async entitiesSearch(
    filter: IRequestSearch
  ): Promise<AxiosResponse<IResponseEntity[]>> {
    try {
      if (!filter.class) {
        delete filter.class;
      }
      const response = await this.connection.get(`/entities`, {
        params: filter,
      });
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async entityCreate(
    newEntityData: IEntity | IStatement | ITerritory
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(`/entities`, newEntityData);
      return response;
    } catch (err: any | AxiosError) {
      console.log(err);
      throw { ...err.response.data };
    }
  }

  async entityClone(
    originalId: string
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/entities/${originalId}/clone`
      );
      return response;
    } catch (err: any | AxiosError) {
      console.log(err);
      throw { ...err.response.data };
    }
  }

  async entityUpdate(
    entityId: string,
    changes: object
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/entities/${entityId}`,
        changes
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async entityDelete(
    entityId: string
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(`/entities/${entityId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async entityRestore(
    entityId: string,
    auditId: string
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(`/entities/${entityId}?fromAudit=${auditId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Detail
   * Detail container
   */
  async detailGet(entityId: string): Promise<AxiosResponse<IResponseDetail>> {
    try {
      const response = await this.connection.get(
        `/entities/${entityId}/detail`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Tree
   * Tree container
   */
  async treeGet(): Promise<AxiosResponse<IResponseTree>> {
    try {
      const response = await this.connection.get(`/tree`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  // this may include parent change
  async treeMoveTerritory(
    moveId: string,
    parentId: string,
    newIndex: number
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.patch(`/tree/${moveId}/position`, {
        parentId,
        newIndex,
      });
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Territory
   * List container
   */
  async territoryGet(
    territoryId: string
  ): Promise<AxiosResponse<IResponseTerritory>> {
    try {
      const response = await this.connection.get(`/territories/${territoryId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * entityIdsInTerritory retieves ids of statements that are used on the territory
   * @see Statement.findDependentStatementIds
   */
  async entityIdsInTerritory(
    territoryId: string
  ): Promise<AxiosResponse<string[]>> {
    try {
      const response = await this.connection.get(
        `/territories/${territoryId}/entities`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Tooltips
   */

  async tooltipGet(
    entityId: string
  ): Promise<AxiosResponse<EntityTooltip.IResponse>> {
    try {
      const response = await this.connection.get(
        `/entities/${entityId}/tooltip`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Audit
   */
  async auditGet(entityId: string): Promise<AxiosResponse<IResponseAudit>> {
    try {
      const response = await this.connection.get(
        `/entities/${entityId}/audits`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Statement
   * Editor container
   */
  async statementGet(
    statementId: string
  ): Promise<AxiosResponse<IResponseStatement>> {
    try {
      const response = await this.connection.get(`/statements/${statementId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async statementReorderElements(
    statementId: string,
    elementIdsWithOrder: string[]
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/statements/${statementId}/elementsOrders`,
        elementIdsWithOrder
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async statementsBatchMove(
    statementsIds: string[],
    territoryId: string
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/statements/batch-move?ids=${statementsIds.join(",")}`,
        {
          territoryId,
        }
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async statementsBatchCopy(
    statementsIds: string[],
    territoryId: string
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/statements/batch-copy?ids=${statementsIds.join(",")}`,
        {
          territoryId,
        }
      );
      // response.data.data should have list of new ids
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async statementsReferencesReplace(
    statementsIds: string[],
    references: IReference[]
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/statements/references?ids=${statementsIds.join(",")}&replace=true`,
        references
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async statementsReferencesAppend(
    statementsIds: string[],
    references: IReference[]
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/statements/references?ids=${statementsIds.join(",")}`,
        references
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Pernmissions
   */

  async getAclPermissions(): Promise<AxiosResponse<IResponsePermission[]>> {
    try {
      const response = await this.connection.get(`/acls`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async updatePermission(
    permissionId: string,
    data: RequestPermissionUpdate
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(`/acls/${permissionId}`, data);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async activate(hash: string): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.patch(
        `/users/active?hash=${hash}`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Relations
   */
  async relationUpdate(
    relationId: string,
    changes: object
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/relations/${relationId}`,
        changes
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async relationCreate(
    newRelation: Relation.IRelation
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(`/relations`, newRelation);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async relationDelete(
    relationId: string
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(`/relations/${relationId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Document titles
   */

  async documentsGet(
    filter: IFilterDocuments
  ): Promise<AxiosResponse<IResponseDocument[]>> {
    try {
      const response = await this.connection.get(`/documents/`, {
        params: filter,
      });
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async documentGet(
    documentId: string
  ): Promise<AxiosResponse<IResponseDocumentDetail>> {
    try {
      const response = await this.connection.get(`/documents/${documentId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async documentDelete(documentId: string): Promise<AxiosResponse<IDocument>> {
    try {
      const response = await this.connection.delete(`/documents/${documentId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Document
   */
  async documentUpload(
    document: Partial<IDocument>
  ): Promise<AxiosResponse<IDocument>> {
    try {
      const response = await this.connection.post(`/documents`, document);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Document update
   */
  async documentUpdate(
    documentId: string,
    document: Partial<IDocument>
  ): Promise<AxiosResponse<IDocument>> {
    try {
      const response = await this.connection.put(
        `/documents/${documentId}`,
        document
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }
}

export default new Api();
