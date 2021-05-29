import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import {
  IResponseUser,
  IResponseActant,
  IResponseAction,
  IResponseTree,
  IResponseTerritory,
  IUser,
  IAction,
  IActant,
  IStatement,
  ITerritory,
  IResponseDetail,
  IResponseStatement,
  IResponseGeneric,
  IResponseBookmarks,
  IResponseAdministration,
} from "@shared/types";
import { connect } from "react-redux";

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

const api = axios.create({
  baseURL: process.env.APIURL + "/api/v1",
  timeout: 5000,
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});

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

    this.token = "";
    this.checkLogin();
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

    if (!!storedToken && !!storedUsername) {
      const parsedToken = parseJwt(storedToken);

      if (parsedToken && Date.now() < parsedToken.exp * 1000) {
        const username = parsedToken.user.name;
        this.saveLogin(storedToken, username);
      } else {
        this.signOut();
      }
    }
  }

  saveLogin(newToken: string, newUserName: string) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("username", newUserName);
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
        this.saveLogin(response.data.token, parsed.user.name);
      }
      return { ...response.data };
    } catch (err) {
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
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  async usersGetMore(
    filters: FilterUsersI
  ): Promise<AxiosResponse<IResponseUser[]>> {
    try {
      const response = await this.connection.post(`/users/getMore`, filters);
      return response;
    } catch (err) {
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
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  async usersUpdate(
    userId: string,
    changes: object
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/users/update/${userId}`,
        changes
      );
      return response;
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  async usersDelete(userId: string): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(`/users/delete/${userId}`);
      return response;
    } catch (err) {
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
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  /**
   * Administration
   * Administration container
   */
  async bookmarksGet(
    userId: string
  ): Promise<AxiosResponse<IResponseBookmarks>> {
    try {
      const response = await this.connection.get(
        `/users/bookmarksGet/${userId}`
      );
      return response;
    } catch (err) {
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
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  async actantsGetMore(
    filter: FilterActantsI
  ): Promise<AxiosResponse<IResponseActant[]>> {
    try {
      const response = await this.connection.post(`/actants/getMore`, filter);
      return response;
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  /**
   * Actions
   */
  async actionsGet(actionId: string): Promise<AxiosResponse<IResponseAction>> {
    try {
      const response = await this.connection.get(`/actions/get/${actionId}`);
      return response;
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  async actionsGetMore(
    filter: FilterActionsI
  ): Promise<AxiosResponse<IResponseAction[]>> {
    try {
      const response = await this.connection.post(`/actions/getMore`, filter);
      return response;
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  async actionsCreate(
    newActionData: IAction
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.post(
        `/actions/create`,
        newActionData
      );
      return response;
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  async actionsUpdate(
    actantId: string,
    changes: object
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.put(
        `/actions/update/${actantId}`,
        changes
      );
      return response;
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  async actionsDelete(
    actantId: string
  ): Promise<AxiosResponse<IResponseGeneric>> {
    try {
      const response = await this.connection.delete(
        `/actions/delete/${actantId}`
      );
      return response;
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  /**
   * Tree
   * Tree container
   */
  async treeGet(): Promise<AxiosResponse<IResponseTree>> {
    try {
      const response = await this.connection.get(`/tree/get`);
      return response;
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      throw { ...err.response.data };
    }
  }
}

export default new Api();
