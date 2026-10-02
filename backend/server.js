import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";
import { initDb } from "./db.js";

import compression from "compression";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import defaultsRoutes from "./routes/defaults.js";
import adaRoutes from "./routes/ada.js";
import officesRoutes from "./routes/offices.js";
import radaiRoutes from "./routes/radai.js";
import reportsRoutes from "./routes/reports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable response compression (gzip/brotli) for ultra-fast API delivery
app.use(compression());

// Security Middleware
app.disable("x-powered-by");
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP header in dev to allow local scripts

// Restricted CORS setup
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:3000",
  process.env.CLIENT_URL
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback for local dev tools
      }
    },
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/defaults", defaultsRoutes);
app.use("/api/ada", adaRoutes);
app.use("/api/offices", officesRoutes);
app.use("/api/radai", radaiRoutes);
app.use("/api/reports", reportsRoutes);

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", service: "ADA System API v2.0" });
});
// J3FF
// Start Server after initializing DB
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(` ADA Backend v2.0 is running on port ${PORT}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(`========================================`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
  });

