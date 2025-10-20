import redis from "@packages/libs/redis";
import { Server as HttPServer } from "http";
import { kafka } from "@packages/utils/kafka";
import { WebSocketServer, WebSocket } from "ws";

const producer = kafka.producer();
const connectedUsers: Map<string, WebSocket> = new Map();
const unseenCounts: Map<string, number> = new Map();

interface IncomingMessage {
  type?: "MESSAGE" | "MARK_AS_SEEN" | "PING";
  fromUserId: string;
  toUserId: string;
  content: string;
  conversationId: string;
  senderType: "user" | "seller";
  tempId?: string; // untuk tracking frontend sementara
}

export async function createWebSocketServer(server: HttPServer) {
  const wss = new WebSocketServer({ server });

  await producer.connect();
  console.log("✅ Kafka producer connected");

  wss.on("connection", (ws: WebSocket) => {
    console.log("🔌 New WebSocket connection");

    let registeredUserId: string | null = null;

    ws.on("message", async (rawMessage) => {
      const messageStr = rawMessage.toString();
      console.log("📩 Received:", messageStr);

      try {
        // 🧾 Step 1 — Handle registration handshake
        if (!registeredUserId && !messageStr.startsWith("{")) {
          registeredUserId = messageStr.trim();
          connectedUsers.set(registeredUserId, ws);
          console.log(`✅ Registered WebSocket for: ${registeredUserId}`);

          const isSeller = registeredUserId.startsWith("seller_");
          const redisKey = isSeller
            ? `online:seller:${registeredUserId.replace("seller_", "")}`
            : `online:user:${registeredUserId.replace("user_", "")}`;

          await redis.set(redisKey, "1");
          await redis.expire(redisKey, 300);
          return;
        }

        // 🧾 Step 2 — Parse JSON payload
        let data: IncomingMessage;
        try {
          data = JSON.parse(messageStr);
        } catch {
          console.warn("⚠️ Invalid JSON message:", messageStr);
          return;
        }

        // 🧠 Step 3 — Handle basic event types
        if (data.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG" }));
          return;
        }

        if (data.type === "MARK_AS_SEEN" && registeredUserId) {
          const seenKey = `${registeredUserId}_${data.conversationId}`;
          unseenCounts.set(seenKey, 0);
          console.log(`👁️ Marked as seen: ${seenKey}`);
          return;
        }

        if (data.type !== "MESSAGE") {
          console.warn("⚠️ Unknown message type:", data.type);
          return;
        }

        // 🧩 Step 4 — Validate message content
        const { fromUserId, toUserId, content, conversationId, senderType } = data;
        if (!fromUserId || !toUserId || !conversationId || !content) {
          console.warn("⚠️ Incomplete message payload:", data);
          return;
        }

        const now = new Date().toISOString();

        // 📨 Step 5 — Construct message
        const messagePayload = {
          conversationId,
          senderId: fromUserId,
          senderType,
          content,
          createdAt: now,
        };

        const messageEvent = JSON.stringify({
          type: "NEW_MESSAGE",
          payload: messagePayload,
        });

        const receiverKey =
          senderType === "user" ? `seller_${toUserId}` : `user_${toUserId}`;
        const senderKey =
          senderType === "user" ? `user_${fromUserId}` : `seller_${fromUserId}`;

        console.log("➡️ Sender:", senderKey, "| Receiver:", receiverKey);
        console.log("👥 Connected:", Array.from(connectedUsers.keys()));

        // 📊 Step 6 — Update unseen counter
        const unseenKey = `${receiverKey}_${conversationId}`;
        const prevCount = unseenCounts.get(unseenKey) || 0;
        unseenCounts.set(unseenKey, prevCount + 1);

        // 📬 Step 7 — Deliver to receiver (if online)
        const receiverSocket = connectedUsers.get(receiverKey);
        if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
          receiverSocket.send(messageEvent);
          receiverSocket.send(
            JSON.stringify({
              type: "UNSEEN_COUNT_UPDATE",
              payload: { conversationId, count: prevCount + 1 },
            })
          );
          console.log(`📤 Delivered message to ${receiverKey}`);
        } else {
          connectedUsers.delete(receiverKey); // hapus socket lama/offline
          console.log(`🕓 ${receiverKey} offline — queued.`);
        }

        // ✅ Step 8 — Send ACK to sender
        const senderSocket = connectedUsers.get(senderKey);
        if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
          senderSocket.send(
            JSON.stringify({
              type: "MESSAGE_ACK",
              payload: {
                conversationId,
                tempId: data.tempId || null,
                timestamp: now,
              },
            })
          );
        }

        // 🧱 Step 9 — Push to Kafka
        await producer.send({
          topic: "chat.new_message",
          messages: [{ value: JSON.stringify(messagePayload) }],
        });

        console.log(`🪣 Queued message to Kafka: ${conversationId}`);
      } catch (error) {
        console.error("❌ Error handling WebSocket message:", error);
      }
    });

    ws.on("close", async () => {
      if (!registeredUserId) return;
      connectedUsers.delete(registeredUserId);

      const isSeller = registeredUserId.startsWith("seller_");
      const redisKey = isSeller
        ? `online:seller:${registeredUserId.replace("seller_", "")}`
        : `online:user:${registeredUserId.replace("user_", "")}`;

      await redis.del(redisKey);
      console.log(`🔌 Disconnected: ${registeredUserId}`);
    });

    ws.on("error", (err) => {
      console.error("⚠️ WebSocket error:", err);
    });
  });

  console.log("🟢 WebSocket server is ready");
}
