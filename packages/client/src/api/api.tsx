import axios from "axios";

console.log(process.env.URL);

export const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  timeout: 5000,
  responseType: "json",
  headers: {
    "Content-Type": "application/json",
  },
});
