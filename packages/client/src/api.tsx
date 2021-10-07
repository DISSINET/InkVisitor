import React from "react";
import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import {
  IResponseUser,
  IResponseActant,
  IResponseAction,
  IResponseTree,
  IResponseTerritory,
  IUser,
  IAction,
  IActant,
  IResponseDetail,
  IResponseStatement,
  IResponseGeneric,
  IResponseAdministration,
  IResponseBookmarkFolder,
  IResponseSearch,
  IResponsePermission,
  RequestPermissionUpdate,
} from "@shared/types";
import * as errors from "@shared/types/errors";
import { toast } from "react-toastify";
import { IRequestSearch } from "types";

type FilterActantsI = {
  label?: string;
  class?: string;
};

type FilterUsersI = {
  label?: string;
};

type FilterActionsI = {
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

  showErrorToast(err: any) {
    const hydratedError = errors.getErrorByCode(
      err.response.data ? err.response.data.error : ""
    );

    toast.error(
      <div>
        {hydratedError.message}
        {err.response.data.message ? (
          <p style={{ fontSize: "1rem" }}>{err.response.data.message}</p>
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
      const response = await this.connection.get(`/users/get/${userId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async usersGetMore(
    filters: FilterUsersI
  ): Promise<AxiosResponse<IResponseUser[]>> {
    try {
      const response = await this.connection.post(`/users/getMore`, filters);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async usersCreate(
    userId: string,
    userData: IUser
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(`/users/create`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async usersUpdate(
    userId: string | false,
    changes: object
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        !!userId ? `/users/update/${userId}` : "/users/update/",
        changes
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async usersDelete(userId: string): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(`/users/delete/${userId}`);
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
    userId: string | false
  ): Promise<AxiosResponse<IResponseBookmarkFolder[]>> {
    try {
      const response = await this.connection.get(
        !!userId ? `/users/bookmarks/${userId}` : "/users/bookmarks/"
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Actants
   * Suggester container
   */
  async actantsGet(actantId: string): Promise<AxiosResponse<IResponseActant>> {
    try {
      const response = await this.connection.get(`/actants/get/${actantId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async actantsGetMore(
    filter: FilterActantsI
  ): Promise<AxiosResponse<IResponseActant[]>> {
    try {
      const response = await this.connection.post(`/actants/getMore`, filter);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async actantsCreate(
    newActantData: IActant
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/actants/create`,
        newActantData
      );
      return response;
    } catch (err: any | AxiosError) {
      console.log(err);
      throw { ...err.response.data };
    }
  }

  async actantsUpdate(
    actantId: string,
    changes: object
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/actants/update/${actantId}`,
        changes
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async actantsDelete(
    actantId: string
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(
        `/actants/delete/${actantId}`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async actantsSearch(
    searchData: IRequestSearch
  ): Promise<AxiosResponse<IResponseSearch[]>> {
    try {
      const response = await this.connection.post(
        `/actants/search`,
        searchData
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Detail
   * Detail container
   */
  async detailGet(actantId: string): Promise<AxiosResponse<IResponseDetail>> {
    try {
      const response = await this.connection.get(`/actants/detail/${actantId}`);
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * Actions
   */
  // async actionsGet(actionId: string): Promise<AxiosResponse<IResponseAction>> {
  //   try {
  //     const response = await this.connection.get(`/actions/get/${actionId}`);
  //     return response;
  //   } catch (err: any | AxiosError) {
  //     throw { ...err.response.data };
  //   }
  // }

  // async actionsGetMore(
  //   filter: FilterActionsI
  // ): Promise<AxiosResponse<IResponseAction[]>> {
  //   try {
  //     const response = await this.connection.post(`/actions/getMore`, filter);
  //     return response;
  //   } catch (err: any | AxiosError) {
  //     throw { ...err.response.data };
  //   }
  // }

  // async actionsCreate(
  //   newActionData: IAction
  // ): Promise<AxiosResponse<IResponseGeneric>> {
  //   try {
  //     const response = await this.connection.post(
  //       `/actions/create`,
  //       newActionData
  //     );
  //     return response;
  //   } catch (err: any | AxiosError) {
  //     throw { ...err.response.data };
  //   }
  // }

  // async actionsUpdate(
  //   actantId: string,
  //   changes: object
  // ): Promise<AxiosResponse<IResponseGeneric>> {
  //   try {
  //     const response = await this.connection.put(
  //       `/actions/update/${actantId}`,
  //       changes
  //     );
  //     return response;
  //   } catch (err: any | AxiosError) {
  //     throw { ...err.response.data };
  //   }
  // }

  // async actionsDelete(
  //   actantId: string
  // ): Promise<AxiosResponse<IResponseGeneric>> {
  //   try {
  //     const response = await this.connection.delete(
  //       `/actions/delete/${actantId}`
  //     );
  //     return response;
  //   } catch (err: any | AxiosError) {
  //     throw { ...err.response.data };
  //   }
  // }

  /**
   * Tree
   * Tree container
   */
  async treeGet(): Promise<AxiosResponse<IResponseTree>> {
    try {
      const response = await this.connection.get(`/tree/get`);
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
      const response = await this.connection.post(`/tree/moveTerritory`, {
        moveId,
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
      const response = await this.connection.get(
        `/territories/get/${territoryId}`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  /**
   * actantIdsInStatementGet retieves ids of statements that are used on the territory
   * @see Statement.findDependentStatementIds
   */
  async actantIdsInTerritory(
    territoryId: string
  ): Promise<AxiosResponse<string[]>> {
    try {
      const response = await this.connection.get(
        `/territories/getActantIds/${territoryId}`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async territoryMoveStatement(
    moveId: string,
    newIndex: number
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/territories/moveStatement`,
        {
          moveId,
          newIndex,
        }
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
      const response = await this.connection.get(
        `/statements/get/${statementId}`
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }

  async getAclPermissions(): Promise<AxiosResponse<IResponsePermission>> {
    try {
      const response = await this.connection.get(`/acl/index`);
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
      const response = await this.connection.put(
        `/acl/update/${permissionId}`,
        data
      );
      return response;
    } catch (err: any | AxiosError) {
      throw { ...err.response.data };
    }
  }
}

export default new Api();
