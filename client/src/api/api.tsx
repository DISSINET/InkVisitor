import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/api/",
  timeout: 5000,
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});
