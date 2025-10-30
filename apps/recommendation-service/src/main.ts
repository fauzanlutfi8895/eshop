import express from "express";
import cookieParser from "cookie-parser";
import router from "./routes/recommendation.routes";
import { errorMiddleware } from "@packages/error-handler/error-middleware";

const app = express();

app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to recommendation-service!" });
});

app.use("/api", router);

app.use(errorMiddleware);

const port = process.env.PORT || 6008;
const server = app.listen(port, () => {
  console.log(`Recommendation service is running http://localhost:${port}/api`);
});
server.on("error", console.error);
