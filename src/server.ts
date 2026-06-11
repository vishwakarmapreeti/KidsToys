import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import routes from "./routes";
import connectDB from "./config/db";

dotenv.config();

console.log("=== SERVER STARTING ===");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("MONGO_URI exists:", !!process.env.MONGO_URI);

const app = express();
let dbPromise: Promise<unknown> | null = null;

function ensureDB() {
  if (!dbPromise) {
    dbPromise = connectDB().catch((err) => {
      dbPromise = null;
      throw err;
    });
  }

  return dbPromise;
}

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000','https://kids-toys-frontend.vercel.app'],
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Backend is running");
});

const PORT = Number(process.env.PORT) || 5002;
app.use("/api/v1", async (req, res, next) => {
  try {
    await ensureDB();
    next();
  } catch (err) {
    console.error("DB CONNECTION ERROR:", err);
    res.status(500).json({ message: "Database connection failed" });
  }
});

app.use("/api/v1", routes);

app.use("/api/v1/ping",(req, res) => {
  res.send("pong");
});


async function start() {
  try {
    console.log("Connecting DB...");
    await ensureDB();

    console.log("Starting Express...");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (err) {
    console.error("STARTUP ERROR:", err);
    process.exit(1);
  }
}

if (process.env.VERCEL !== "1") {
  start();
}

export default app;
