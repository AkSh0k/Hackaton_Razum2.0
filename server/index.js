import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import eventsRoutes from "./routes/events.js";
import healthRoutes from "./routes/health.js";
import hrRoutes from "./routes/hr.js";
import participationsRoutes from "./routes/participations.js";
import usersRoutes from "./routes/users.js";

const app = express();

app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/api", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/participations", participationsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/hr", hrRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(config.port, config.host, () => {
  console.log(`API listening on http://${config.host}:${config.port}`);
});
