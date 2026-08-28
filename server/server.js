import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.js";
import contributorRoutes from "./routes/contributors.js";

dotenv.config();

// Fail fast with a clear message instead of admin login mysteriously
// throwing 500s later. This is the #1 cause of "login doesn't work":
// no server/.env file (copy it from server/.env.example) or JWT_SECRET
// left blank in it.
if (!process.env.JWT_SECRET) {
  console.error(
    "Missing JWT_SECRET. Copy server/.env.example to server/.env and set a real JWT_SECRET value, then restart the server."
  );
  process.exit(1);
}

const app = express();
const port = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await connectDB();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/contributors", contributorRoutes);

const clientDist = path.join(__dirname, "..", "client", "dist");
app.use(express.static(clientDist));

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
