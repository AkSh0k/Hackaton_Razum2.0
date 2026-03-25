import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { serializeUser } from "../lib/serializers.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/tokens.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const profileSchema = z.object({
  city: z.string().max(120).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  avatarUrl: z.string().url().optional().nullable(),
});

function setAuthCookies(res, accessToken, refreshToken) {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };

  res.cookie("accessToken", accessToken, { ...cookieOptions, maxAge: 15 * 60 * 1000 });
  res.cookie("refreshToken", refreshToken, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

function clearAuthCookies(res) {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const { email, password, fullName } = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      role: "participant",
      isApproved: true,
      profile: {
        create: {
          rank: "Bronze",
        },
      },
    },
    include: { profile: true },
  });

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  return res.status(201).json({ user: serializeUser(user), accessToken });
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { profile: true },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  setAuthCookies(res, accessToken, refreshToken);

  return res.json({ user: serializeUser(user), accessToken });
});

router.post("/refresh", async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Refresh token is missing" });
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      include: { profile: true },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setAuthCookies(res, accessToken, refreshToken);

    return res.json({ user: serializeUser(user), accessToken });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookies(res);
  return res.status(204).send();
});

router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: serializeUser(req.user) });
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = profileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: "Invalid payload", errors: parsed.error.flatten() });
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      profile: {
        upsert: {
          create: {
            city: parsed.data.city ?? null,
            bio: parsed.data.bio ?? null,
            avatarUrl: parsed.data.avatarUrl ?? null,
          },
          update: {
            city: parsed.data.city ?? null,
            bio: parsed.data.bio ?? null,
            avatarUrl: parsed.data.avatarUrl ?? null,
          },
        },
      },
    },
    include: { profile: true },
  });

  return res.json({ user: serializeUser(user) });
});

export default router;
