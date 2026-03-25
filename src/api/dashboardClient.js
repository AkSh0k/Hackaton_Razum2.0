import { httpClient } from "./httpClient";

export const dashboardClient = {
  participant() {
    return httpClient("/dashboard/participant");
  },
};
