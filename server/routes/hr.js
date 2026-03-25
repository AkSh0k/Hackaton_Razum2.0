import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { serializeParticipation, serializeUser } from "../lib/serializers.js";
import { requireAuth, requireRole } from "../middleware/require-auth.js";

const router = Router();

router.get("/candidates", requireAuth, requireRole("observer", "admin", "organizer"), async (_req, res) => {
  const [users, participations] = await Promise.all([
    prisma.user.findMany({
      where: { role: "participant" },
      include: { profile: true },
      orderBy: { profile: { totalPoints: "desc" } },
      take: 200,
    }),
    prisma.participation.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  return res.json({
    users: users.map(serializeUser),
    participations: participations.map(serializeParticipation),
  });
});

export default router;
