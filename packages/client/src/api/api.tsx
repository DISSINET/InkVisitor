import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";
import {
    ResponseUserI,
    ResponseActantI,
    ResponseActionI,
    ResponseTreeI,
    ResponseTerritoryI,
    UserI,
    ActionI,
    ActantI,
    StatementI,
    TerritoryI,
} from "@shared/types";

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

export const api = axios.create({
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

    /**
     * Authentication
     */

    checkLogin() {
        let storedToken = localStorage.getItem("token");
        let storedUsername = localStorage.getItem("username");

        if (!!storedToken && !!storedUsername) {
            const parsedToken = parseJwt(storedToken);

            if (parsedToken && Date.now() < parsedToken.exp * 1000) {
                this.saveLogin(storedToken, parsedToken.user);
            } else {
            }
        }
    }

    saveLogin(newToken: string, newUserName: string) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("username", newUserName);
        this.token = newToken;
        // set global
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
                this.saveLogin(response.data.token, parsed.user);
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

    async usersGet(userId: string): Promise<AxiosResponse> {
        try {
            const response = await this.connection.get(`/users/id=${userId}`);
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async usersGetMore(filters: FilterUsersI): Promise<AxiosResponse> {
        try {
            const response = await this.connection.post(
                `/users/getMore`,
                filters
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async usersCreate(userId: string, userData: UserI): Promise<AxiosResponse> {
        try {
            const response = await this.connection.post(`/users`);
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async usersUpdate(userId: string, changes: object): Promise<AxiosResponse> {
        try {
            const response = await this.connection.put(
                `/users/${userId}`,
                changes
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async usersDelete(userId: string): Promise<AxiosResponse> {
        try {
            const response = await this.connection.delete(`/users/${userId}`);
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    /**
     * Actants
     */
    async actantsGet(actantId: string): Promise<AxiosResponse> {
        try {
            const response = await this.connection.get(`/actants/${actantId}`);
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async actantsGetMore(filter: FilterActantsI): Promise<AxiosResponse> {
        try {
            const response = await this.connection.put(
                `/actants/getMore`,
                filter
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async actantsCreate(newActantData: ActantI): Promise<AxiosResponse> {
        try {
            const response = await this.connection.post(
                `/actants`,
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
    ): Promise<AxiosResponse> {
        try {
            const response = await this.connection.put(
                `/actants/${actantId}`,
                changes
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async actantsDelete(actantId: string): Promise<AxiosResponse> {
        try {
            const response = await this.connection.delete(
                `/actants/${actantId}`
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    /**
     * Actions
     */
    async actionsGet(actionId: string): Promise<AxiosResponse> {
        try {
            const response = await this.connection.get(`/actions/${actionId}`);
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async actionsGetMore(filter: FilterActionsI): Promise<AxiosResponse> {
        try {
            const response = await this.connection.put(
                `/actions/getMore`,
                filter
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async actionsCreate(newActionData: ActionI): Promise<AxiosResponse> {
        try {
            const response = await this.connection.post(
                `/actions`,
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
    ): Promise<AxiosResponse> {
        try {
            const response = await this.connection.put(
                `/actions/${actantId}`,
                changes
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async actionsDelete(actantId: string): Promise<AxiosResponse> {
        try {
            const response = await this.connection.delete(
                `/actions/${actantId}`
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    /**
     * Tree
     */
    async treeGet(): Promise<AxiosResponse> {
        try {
            const response = await this.connection.get(`/tree`);
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    /**
     * Territory
     */
    async territoryGet(territoryId: string): Promise<AxiosResponse> {
        try {
            const response = await this.connection.post(
                `/territory/${territoryId}`
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async territoryMoveTerritory(
        moveId: string,
        beforeId: string | false,
        afterId: string | false
    ): Promise<AxiosResponse> {
        try {
            const response = await this.connection.post(
                `/territory/moveTerritory`,
                {
                    moveId,
                    beforeId,
                    afterId,
                }
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }

    async territoryMoveStatement(
        moveId: string,
        beforeId: string | false,
        afterId: string | false
    ): Promise<AxiosResponse> {
        try {
            const response = await this.connection.post(
                `/territory/moveStatement`,
                {
                    moveId,
                    beforeId,
                    afterId,
                }
            );
            return response;
        } catch (err) {
            throw { ...err.response.data };
        }
    }
}

export default new Api();
