import jwt from "jsonwebtoken";
import { config } from "../config.js";

const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "7d";

export function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    config.accessSecret,
    { expiresIn: ACCESS_TOKEN_TTL }
  );
}

export function signRefreshToken(user) {
  return jwt.sign(
    {
      sub: user.id,
    },
    config.refreshSecret,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, config.accessSecret);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, config.refreshSecret);
}
