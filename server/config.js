import dotenv from "dotenv";

dotenv.config();

function requireEnv(name, fallback = undefined) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const config = {
  host: process.env.SERVER_HOST || "127.0.0.1",
  port: Number(process.env.SERVER_PORT || 3001),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  accessSecret: requireEnv("JWT_ACCESS_SECRET", "dev-access-secret"),
  refreshSecret: requireEnv("JWT_REFRESH_SECRET", "dev-refresh-secret"),
};
