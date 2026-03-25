const sortFieldMap = {
  created_date: "createdAt",
  updated_date: "updatedAt",
  full_name: "fullName",
  total_points: "totalPoints",
  total_events: "totalEvents",
  events_organized: "eventsOrganized",
  trust_rating: "trustRating",
  base_points: "basePoints",
  difficulty_coefficient: "difficultyCoefficient",
  end_date: "endDate",
};

export function parseLimit(raw, fallback = 50, max = 500) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }
  return Math.min(value, max);
}

export function parseSort(rawSort, fallbackField = "createdAt") {
  if (!rawSort || typeof rawSort !== "string") {
    return { [fallbackField]: "desc" };
  }

  const direction = rawSort.startsWith("-") ? "desc" : "asc";
  const rawField = rawSort.replace(/^-/, "");
  const field = sortFieldMap[rawField] || rawField;

  return { [field]: direction };
}
