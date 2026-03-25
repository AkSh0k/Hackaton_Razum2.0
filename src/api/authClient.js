import { httpClient } from "./httpClient";

export const authClient = {
  register(payload) {
    return httpClient("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  login(payload) {
    return httpClient("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  refresh() {
    return httpClient("/auth/refresh", {
      method: "POST",
    });
  },

  logout() {
    return httpClient("/auth/logout", {
      method: "POST",
    });
  },

  me() {
    return httpClient("/auth/me");
  },

  updateMe(payload) {
    return httpClient("/auth/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
