import { httpClient } from "./httpClient";

export const hrClient = {
  candidates() {
    return httpClient("/hr/candidates");
  },
};
