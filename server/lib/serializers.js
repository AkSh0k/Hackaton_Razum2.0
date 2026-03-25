export function getRankFromPoints(points = 0) {
  if (points >= 6000) return "Diamond";
  if (points >= 3000) return "Platinum";
  if (points >= 1500) return "Gold";
  if (points >= 500) return "Silver";
  return "Bronze";
}

export function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    full_name: user.fullName,
    role: user.role,
    is_approved: user.isApproved,
    city: user.profile?.city ?? null,
    age: user.profile?.age ?? null,
    bio: user.profile?.bio ?? null,
    avatar_url: user.profile?.avatarUrl ?? null,
    total_points: user.profile?.totalPoints ?? 0,
    total_events: user.profile?.totalEvents ?? 0,
    rank: user.profile?.rank ?? getRankFromPoints(user.profile?.totalPoints ?? 0),
    leaderboard_position: user.profile?.leaderboardPosition ?? null,
    trust_rating: user.profile?.trustRating ?? null,
    events_organized: user.profile?.eventsOrganized ?? 0,
    categories: user.profile?.categories ?? [],
    created_date: user.createdAt,
  };
}

export function serializeEvent(event) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    date: event.date.toISOString().slice(0, 10),
    end_date: event.endDate ? event.endDate.toISOString().slice(0, 10) : null,
    category: event.category,
    difficulty_coefficient: event.difficultyCoefficient,
    base_points: event.basePoints,
    location: event.location,
    max_participants: event.maxParticipants,
    status: event.status,
    bonus_description: event.bonusDescription,
    organizer_id: event.organizerId,
    organizer_name: event.organizer?.fullName ?? null,
    created_date: event.createdAt,
  };
}

export function serializeParticipation(participation) {
  return {
    id: participation.id,
    event_id: participation.eventId,
    event_title: participation.eventTitleSnapshot,
    participant_id: participation.participantId,
    participant_name: participation.participantName,
    participant_email: participation.participantEmail,
    status: participation.status,
    points_earned: participation.pointsEarned,
    event_date: participation.eventDateSnapshot.toISOString().slice(0, 10),
    event_category: participation.eventCategorySnapshot,
    difficulty_coefficient: participation.difficultyCoefficient,
    verified_by: participation.verifiedById,
    verified_at: participation.verifiedAt,
    created_date: participation.createdAt,
  };
}

export function serializeFeedback(feedback) {
  return {
    id: feedback.id,
    user_id: feedback.userId,
    event_id: feedback.eventId,
    rating: feedback.rating,
    comment: feedback.comment,
    created_date: feedback.createdAt,
  };
}
