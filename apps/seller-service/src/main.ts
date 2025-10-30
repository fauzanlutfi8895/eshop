import express from "express";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import cookieParser from "cookie-parser";
import router from "./routes/seller.route";
// const swaggerDocument = require("./swagger-output.json");

const app = express();

// Limit body size to 5mb (accounts for base64 encoding overhead)
// Base64 encoding increases size by ~33%, so 3MB image = ~4MB base64
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send({ message: "Hallo Api User Service Menyala" });
});

// app.use("/product-api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// app.get("/docs-json", (req, res) => {
//   res.json(swaggerDocument);
// });

// Routes
app.use("/api", router);

app.use(errorMiddleware);

const port = process.env.PORT || 6003;
const server = app.listen(port, () => {
  console.log(`User service is running at http://localhost:${port}/api`);
  console.log(`Swagger Docs available at http://localhost:${port}/docs`);
});

server.on("error", (err) => {
  console.log("Server error:", err);
});
