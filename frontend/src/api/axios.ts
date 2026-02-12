import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:3000/",
  withCredentials: true,
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Unauthorized access - perhaps redirect to login?");
    }
    return Promise.reject(error);
  },
);

export default api;
