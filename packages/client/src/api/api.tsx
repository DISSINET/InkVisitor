import axios from "axios";
import store from "redux/store";

export const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  timeout: 5000,
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});
