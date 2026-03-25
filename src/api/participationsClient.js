import { httpClient } from "./httpClient";

export const participationsClient = {
  list({ participantId, eventId, status, sort = "-created_date", limit = 100 } = {}) {
    const params = new URLSearchParams();
    if (participantId) params.set("participant_id", participantId);
    if (eventId) params.set("event_id", eventId);
    if (status) params.set("status", status);
    if (sort) params.set("sort", sort);
    if (limit) params.set("limit", String(limit));

    return httpClient(`/participations?${params.toString()}`);
  },

  update(id, payload) {
    return httpClient(`/participations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  verify(id) {
    return httpClient(`/participations/${id}/verify`, {
      method: "POST",
    });
  },

  reject(id) {
    return httpClient(`/participations/${id}/reject`, {
      method: "POST",
    });
  },
};
