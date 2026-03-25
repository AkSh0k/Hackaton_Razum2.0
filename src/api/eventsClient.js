import { httpClient } from "./httpClient";

export const eventsClient = {
  list({ sort = "-created_date", limit = 50, organizerId, status, category } = {}) {
    const params = new URLSearchParams();
    if (sort) params.set("sort", sort);
    if (limit) params.set("limit", String(limit));
    if (organizerId) params.set("organizer_id", organizerId);
    if (status) params.set("status", status);
    if (category) params.set("category", category);

    return httpClient(`/events?${params.toString()}`);
  },

  get(id) {
    return httpClient(`/events/${id}`);
  },

  create(payload) {
    return httpClient("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  update(id, payload) {
    return httpClient(`/events/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  delete(id) {
    return httpClient(`/events/${id}`, {
      method: "DELETE",
    });
  },

  getParticipations(id, { sort = "-created_date", limit = 500 } = {}) {
    const params = new URLSearchParams({ sort, limit: String(limit) });
    return httpClient(`/events/${id}/participations?${params.toString()}`);
  },

  join(id) {
    return httpClient(`/events/${id}/join`, {
      method: "POST",
    });
  },
};
