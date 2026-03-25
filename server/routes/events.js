import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { parseLimit, parseSort } from "../lib/query.js";
import { recalculateUserProfile } from "../lib/profile-stats.js";
import { serializeEvent, serializeParticipation } from "../lib/serializers.js";
import { requireAuth, requireRole } from "../middleware/require-auth.js";

const router = Router();

const eventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  date: z.string().min(1),
  end_date: z.string().nullable().optional(),
  category: z.string().min(1),
  difficulty_coefficient: z.coerce.number().min(0.1).max(10).default(1),
  base_points: z.coerce.number().int().min(0).default(100),
  location: z.string().nullable().optional(),
  max_participants: z.coerce.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "upcoming", "active", "completed", "cancelled"]).default("upcoming"),
  bonus_description: z.string().nullable().optional(),
});

router.get("/", requireAuth, async (req, res) => {
  const where = {};

  if (req.query.status) where.status = req.query.status;
  if (req.query.category) where.category = req.query.category;
  if (req.query.organizer_id) where.organizerId = String(req.query.organizer_id);

  const events = await prisma.event.findMany({
    where,
    include: { organizer: true },
    orderBy: parseSort(req.query.sort, "createdAt"),
    take: parseLimit(req.query.limit, 50),
  });

  res.json(events.map(serializeEvent));
});

router.get("/:id", requireAuth, async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
    include: { organizer: true },
  });

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  return res.json(serializeEvent(event));
});

router.post("/", requireAuth, requireRole("organizer", "admin"), async (req, res) => {
  const parsed = eventSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const payload = parsed.data;
  const event = await prisma.event.create({
    data: {
      title: payload.title,
      description: payload.description ?? null,
      date: new Date(payload.date),
      endDate: payload.end_date ? new Date(payload.end_date) : null,
      category: payload.category,
      difficultyCoefficient: payload.difficulty_coefficient,
      basePoints: payload.base_points,
      location: payload.location ?? null,
      maxParticipants: payload.max_participants ?? null,
      status: payload.status,
      bonusDescription: payload.bonus_description ?? null,
      organizerId: req.user.id,
    },
    include: { organizer: true },
  });

  await recalculateUserProfile(req.user.id);
  return res.status(201).json(serializeEvent(event));
});

router.patch("/:id", requireAuth, requireRole("organizer", "admin"), async (req, res) => {
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ message: "Event not found" });
  }

  if (req.user.role !== "admin" && existing.organizerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const payload = req.body;
  const event = await prisma.event.update({
    where: { id: req.params.id },
    data: {
      title: payload.title ?? existing.title,
      description: payload.description ?? existing.description,
      date: payload.date ? new Date(payload.date) : existing.date,
      endDate: payload.end_date ? new Date(payload.end_date) : existing.endDate,
      category: payload.category ?? existing.category,
      difficultyCoefficient:
        payload.difficulty_coefficient !== undefined ? Number(payload.difficulty_coefficient) : existing.difficultyCoefficient,
      basePoints: payload.base_points !== undefined ? Number(payload.base_points) : existing.basePoints,
      location: payload.location ?? existing.location,
      maxParticipants:
        payload.max_participants !== undefined ? Number(payload.max_participants) || null : existing.maxParticipants,
      status: payload.status ?? existing.status,
      bonusDescription: payload.bonus_description ?? existing.bonusDescription,
    },
    include: { organizer: true },
  });

  return res.json(serializeEvent(event));
});

router.delete("/:id", requireAuth, requireRole("organizer", "admin"), async (req, res) => {
  const existing = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ message: "Event not found" });
  }

  if (req.user.role !== "admin" && existing.organizerId !== req.user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await prisma.event.delete({ where: { id: req.params.id } });
  await recalculateUserProfile(existing.organizerId);
  return res.status(204).send();
});

router.get("/:id/participations", requireAuth, async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  const participations = await prisma.participation.findMany({
    where: { eventId: req.params.id },
    orderBy: parseSort(req.query.sort, "createdAt"),
    take: parseLimit(req.query.limit, 500),
  });

  return res.json(participations.map(serializeParticipation));
});

router.post("/:id/join", requireAuth, requireRole("participant"), async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { id: req.params.id },
  });

  if (!event) {
    return res.status(404).json({ message: "Event not found" });
  }

  const existing = await prisma.participation.findUnique({
    where: {
      eventId_participantId: {
        eventId: event.id,
        participantId: req.user.id,
      },
    },
  });

  if (existing) {
    return res.status(409).json({ message: "Already joined" });
  }

  const participation = await prisma.participation.create({
    data: {
      eventId: event.id,
      participantId: req.user.id,
      status: "pending",
      pointsEarned: 0,
      eventTitleSnapshot: event.title,
      participantName: req.user.fullName,
      participantEmail: req.user.email,
      eventDateSnapshot: event.date,
      eventCategorySnapshot: event.category,
      difficultyCoefficient: event.difficultyCoefficient,
    },
  });

  return res.status(201).json(serializeParticipation(participation));
});
export default router;