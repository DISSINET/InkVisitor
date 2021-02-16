import { User } from "@auth0/auth0-react/dist/auth-state";
import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from "axios";

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
  private user: User;

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
      timeout: 5000,
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

  async get(url: string): Promise<any> {
    return this.connection.get(url);
  }

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

  saveLogin(newToken: string, user: User) {
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(user));
    this.token = newToken;
    this.user = user;
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
  }

  getUser(): User {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.user;
  }
}

export default new Api();
