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
} from "@shared/types";
import * as errors from "@shared/types/errors";
import { IRequestSearch } from "@shared/types/request-search";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import React from "react";
import { toast } from "react-toastify";

type IFilterUsers = {
  label?: string;
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
  private headers: object;
  private connection: AxiosInstance;
  private token: string;

  constructor() {
    if (!process.env.APIURL) {
      throw new Error("APIURL is not set");
    }

    this.baseUrl = process.env.APIURL + "/api/v1";
    this.headers = {
      "Content-Type": "application/json",
      //"Content-Encoding": "gzip",
    };

    this.connection = axios.create({
      baseURL: this.baseUrl,
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
   * Administration
   * Administration container
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
   * Audits for statements in territory
   */
  async auditsForStatements(
    territoryId: string
  ): Promise<AxiosResponse<IResponseAudit[]>> {
    try {
      const response = await this.connection.get(
        `/audits?forTerritory=${territoryId}`
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
}

export default new Api();
