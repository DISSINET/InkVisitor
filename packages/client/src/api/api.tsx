import axios, { AxiosInstance, AxiosResponse } from "axios";

console.log(process.env.URL);

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

  checkLogin() {
    console.log("checking whether user logged in previously");
    let storedToken = localStorage.getItem("token");
    let storedUsername = localStorage.getItem("username");

    console.log("token", storedToken);
    if (!!storedToken && !!storedUsername) {
      const parsedToken = parseJwt(storedToken);

      if (parsedToken && Date.now() < parsedToken.exp * 1000) {
        console.log("yes, user was saved previously", storedUsername);
        this.saveLogin(storedToken, storedUsername);
      } else {
      }
    }
  }

  saveLogin(newToken: string, newUsername: string) {
    setTimeout(() => {
      localStorage.setItem("token", newToken);
      localStorage.setItem("username", newUsername);
      this.token = newToken;
    }, 100);
  }

  async signIn(username: string, password: string): Promise<any> {
    console.log("going to try to sign in ");
    try {
      const response = (await this.connection.post(
        "/users/signin",
        {
          username: username,
          password: password,
        },
        {}
      )) as AxiosResponse;
      console.log("login response", response.data);
      if (response.status === 200) {
        this.saveLogin(response.data.token, username);
      }
      return { ...response.data };
    } catch (err) {
      throw { ...err.response.data };
    }
  }

  async signOut() {
    console.log("going to sign out");
    localStorage.setItem("token", "");
    localStorage.setItem("username", "");
    this.token = "";
  }
}

export default new Api();
