import { httpClient } from "./httpClient";

export const usersClient = {
  list({ role, sort = "-created_date", limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    if (sort) params.set("sort", sort);
    if (limit) params.set("limit", String(limit));

    return httpClient(`/users?${params.toString()}`);
  },

  leaderboard(limit = 100) {
    return httpClient(`/users/leaderboard?limit=${limit}`);
  },

  organizerProfile(id, limit = 20) {
    return httpClient(`/users/${id}/organizer-profile?limit=${limit}`);
  },

  participations(id, { sort = "-created_date", limit = 100 } = {}) {
    const params = new URLSearchParams({ sort, limit: String(limit) });
    return httpClient(`/users/${id}/participations?${params.toString()}`);
  },

  update(id, payload) {
    return httpClient(`/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },
};
