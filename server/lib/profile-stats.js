import { prisma } from "./prisma.js";
import { getRankFromPoints } from "./serializers.js";

export async function recalculateUserProfile(userId) {
  const [verifiedParticipations, organizedEvents] = await Promise.all([
    prisma.participation.findMany({
      where: {
        participantId: userId,
        status: "verified",
      },
      select: {
        pointsEarned: true,
        eventCategorySnapshot: true,
      },
    }),
    prisma.event.count({
      where: { organizerId: userId },
    }),
  ]);

  const totalPoints = verifiedParticipations.reduce((sum, item) => sum + (item.pointsEarned || 0), 0);
  const totalEvents = verifiedParticipations.length;
  const categories = [...new Set(verifiedParticipations.map((item) => item.eventCategorySnapshot).filter(Boolean))];
  const rank = getRankFromPoints(totalPoints);

  return prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      totalPoints,
      totalEvents,
      rank,
      categories,
      eventsOrganized: organizedEvents,
    },
    update: {
      totalPoints,
      totalEvents,
      rank,
      categories,
      eventsOrganized: organizedEvents,
    },
  });
}
