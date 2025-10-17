import express from "express";
import cookieParser from "cookie-parser";
import { createWebSocketServer } from "./websocket";
import { startConsumer } from "./chat-message.consumer";
import router from "./routes/chat.route";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to chatting-service!" });
});

// Routes (/chatting)
app.use("/api", router)

const port = process.env.PORT || 6007;
const server = app.listen(port, () => {
  console.log(`Chatting service listening at http://localhost:${port}/api`);
});

// Websocket server
createWebSocketServer(server);

// Start Kafka Consumer
startConsumer().catch((error: any) => {
  console.error(error);
});

server.on("error", console.error);
