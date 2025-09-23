/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";
import * as path from "path";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import cookieParser from "cookie-parser";
import initializeSiteConfig from "./libs/initializeSiteConfig";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(morgan("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1);

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req: any) => (req.user ? 1000000 : 100),
  message: { error: "Too many request, please try again later!" },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req: any) => {
    if (req.query.apiKey) return req.query.apiKey;
    return ipKeyGenerator(req.ip);
  },
});

app.use(limiter);

app.use("/assets", express.static(path.join(__dirname, "assets")));

app.get("/gateway-health", (req, res) => {
  res.send({ message: "Welcome to api-gateway!" });
});

app.use("/product", proxy("http://localhost:6002"));
app.use("/", proxy("http://localhost:6001"));

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  try {
    initializeSiteConfig();
    console.log("Site config Initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize site config: ", error);
  }
});
server.on("error", console.error);
