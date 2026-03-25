import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { parseLimit, parseSort } from "../lib/query.js";
import { serializeEvent, serializeParticipation, serializeUser } from "../lib/serializers.js";
import { requireAuth, requireRole } from "../middleware/require-auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const where = {};
  if (req.query.role) where.role = String(req.query.role);

  const profileOrderField = Object.keys(parseSort(req.query.sort, "createdAt"))[0];
  const profileOrderDirection = Object.values(parseSort(req.query.sort, "createdAt"))[0];
  const profileSortableFields = new Set(["totalPoints", "totalEvents", "eventsOrganized", "trustRating"]);

  const users = await prisma.user.findMany({
    where,
    include: { profile: true },
    orderBy: profileSortableFields.has(profileOrderField)
      ? { profile: { [profileOrderField]: profileOrderDirection } }
      : parseSort(req.query.sort, "createdAt"),
    take: parseLimit(req.query.limit, 100),
  });

  return res.json(users.map(serializeUser));
});

router.get("/leaderboard", requireAuth, async (req, res) => {
  const users = await prisma.user.findMany({
    where: { role: "participant" },
    include: { profile: true },
    orderBy: { profile: { totalPoints: "desc" } },
    take: parseLimit(req.query.limit, 100),
  });

  return res.json(users.map(serializeUser));
});

router.get("/:id/organizer-profile", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: {
      profile: true,
      organizedEvents: {
        include: { organizer: true },
        orderBy: { date: "desc" },
        take: parseLimit(req.query.limit, 20, 100),
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "Organizer not found" });
  }

  return res.json({
    profile: serializeUser(user),
    events: user.organizedEvents.map(serializeEvent),
  });
});

router.get("/:id/participations", requireAuth, async (req, res) => {
  const participations = await prisma.participation.findMany({
    where: { participantId: req.params.id },
    orderBy: parseSort(req.query.sort, "createdAt"),
    take: parseLimit(req.query.limit, 100),
  });

  return res.json(participations.map(serializeParticipation));
});

router.patch("/:id", requireAuth, requireRole("organizer", "admin"), async (req, res) => {
  const existing = await prisma.user.findUnique({
    where: { id: req.params.id },
    include: { profile: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "User not found" });
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: {
      role: req.body.role ?? existing.role,
      isApproved: req.body.is_approved ?? existing.isApproved,
    },
    include: { profile: true },
  });

  return res.json(serializeUser(user));
});

export default router;
