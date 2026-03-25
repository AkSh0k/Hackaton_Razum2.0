import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { parseLimit, parseSort } from "../lib/query.js";
import { recalculateUserProfile } from "../lib/profile-stats.js";
import { serializeParticipation } from "../lib/serializers.js";
import { requireAuth, requireRole } from "../middleware/require-auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const where = {};
  if (req.query.participant_id) where.participantId = String(req.query.participant_id);
  if (req.query.event_id) where.eventId = String(req.query.event_id);
  if (req.query.status) where.status = String(req.query.status);

  const participations = await prisma.participation.findMany({
    where,
    orderBy: parseSort(req.query.sort, "createdAt"),
    take: parseLimit(req.query.limit, 100),
  });

  return res.json(participations.map(serializeParticipation));
});

router.patch("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.participation.findUnique({
    where: { id: req.params.id },
    include: { event: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Participation not found" });
  }

  const isOwner = existing.participantId === req.user.id;
  const isOrganizer = existing.event.organizerId === req.user.id || req.user.role === "admin";

  if (!isOwner && !isOrganizer) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const participation = await prisma.participation.update({
    where: { id: req.params.id },
    data: {
      status: req.body.status ?? existing.status,
    },
  });

  if (existing.participantId) {
    await recalculateUserProfile(existing.participantId);
  }

  return res.json(serializeParticipation(participation));
});

router.post("/:id/verify", requireAuth, requireRole("organizer", "admin"), async (req, res) => {
  const existing = await prisma.participation.findUnique({
    where: { id: req.params.id },
    include: { event: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Participation not found" });
  }

  const isOrganizer = existing.event.organizerId === req.user.id || req.user.role === "admin";
  if (!isOrganizer) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const points = Math.round((existing.event.basePoints || 0) * (existing.event.difficultyCoefficient || 1));

  const participation = await prisma.participation.update({
    where: { id: req.params.id },
    data: {
      status: "verified",
      pointsEarned: points,
      verifiedById: req.user.id,
      verifiedAt: new Date(),
    },
  });

  await recalculateUserProfile(existing.participantId);
  return res.json(serializeParticipation(participation));
});

router.post("/:id/reject", requireAuth, requireRole("organizer", "admin"), async (req, res) => {
  const existing = await prisma.participation.findUnique({
    where: { id: req.params.id },
    include: { event: true },
  });

  if (!existing) {
    return res.status(404).json({ message: "Participation not found" });
  }

  const isOrganizer = existing.event.organizerId === req.user.id || req.user.role === "admin";
  if (!isOrganizer) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const participation = await prisma.participation.update({
    where: { id: req.params.id },
    data: {
      status: "rejected",
      pointsEarned: 0,
      verifiedById: req.user.id,
      verifiedAt: new Date(),
    },
  });

  await recalculateUserProfile(existing.participantId);
  return res.json(serializeParticipation(participation));
});

export default router;
