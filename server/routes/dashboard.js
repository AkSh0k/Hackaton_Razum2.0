import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeEvent, serializeParticipation, serializeUser } from "../lib/serializers.js";
import { requireAuth, requireRole } from "../middleware/require-auth.js";

const router = Router();

router.get("/participant", requireAuth, requireRole("participant"), async (req, res) => {
  const [events, participations, topUsers] = await Promise.all([
    prisma.event.findMany({
      include: { organizer: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.participation.findMany({
      where: { participantId: req.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.user.findMany({
      where: { role: "participant" },
      include: { profile: true },
      orderBy: { profile: { totalPoints: "desc" } },
      take: 5,
    }),
  ]);

  return res.json({
    events: events.map(serializeEvent),
    participations: participations.map(serializeParticipation),
    topUsers: topUsers.map(serializeUser),
  });
});

export default router;
