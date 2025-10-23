import redis from "@packages/libs/redis";
import { Server as HttPServer } from "http";
import { kafka } from "@packages/utils/kafka";
import { WebSocketServer, WebSocket } from "ws";
import {
  clearUnseenCount,
  getUnseenCount,
} from "@packages/libs/redis/message.redis";

const producer = kafka.producer();
const connectedUsers: Map<string, WebSocket> = new Map();

// Awal pesan menerima handshake dulu, baru ini
interface IncomingMessage {
  type: "MESSAGE" | "MARK_AS_SEEN" | "PONG";
  fromUserId: string;
  toUserId: string;
  content: string;
  conversationId: string;
  senderType: "user" | "seller";
  tempId?: string; // untuk tracking frontend sementara
}

const HEARTBEAT_INTERVAL = 25000; // 25 detik
const PONG_TIMEOUT = 30000; // 30 detik

const startHeartbeat = (ws: WebSocket, redisKey: string) => {
  let lastPong = Date.now();

  const interval = setInterval(async () => {
    if (ws.readyState === WebSocket.OPEN) {
      // send, ws hanya bisa menerima format string
      ws.send(JSON.stringify({ type: "PING" })); //dalam format json {"type":"PING"} -> property ada ""
    }

    // kalau > 30 detik tidak dapat PONG, anggap koneksi mati
    if (Date.now() - lastPong > PONG_TIMEOUT) {
      console.warn("⚠️ No PONG, reconnecting...");
      clearInterval(interval);
      ws.close(); // akan memicu onclose
      await redis.del(redisKey);
    }
  }, HEARTBEAT_INTERVAL);

  return (pongTime: number) => {
    lastPong = pongTime;
  };
};

export async function createWebSocketServer(server: HttPServer) {
  const wss = new WebSocketServer({ server });

  await producer.connect();
  console.log("✅ Kafka producer connected");

  wss.on("connection", (ws: WebSocket) => {
    console.log("🔌 New WebSocket connection");

    let registeredUserId: string | null = null;
    let redisKey: string | null = null;
    let updateLastPong: ((pongTime: number) => void) | null = null;

    // menerima dari client (Menerima paling awal)
    ws.on("message", async (rawMessage) => {
      const messageStr = rawMessage.toString();
      console.log("📩 Received (Isi pesan):", messageStr);

      try {
        // 🧾 Step 1 — Handle registration handshake && status online redis
        // Menerima pesan format string saja (seller_123)
        if (!registeredUserId && !messageStr.startsWith("{")) {
          registeredUserId = messageStr.trim();
          connectedUsers.set(registeredUserId, ws);
          console.log(`✅ Registered WebSocket for: ${registeredUserId}`);

          const isSeller = registeredUserId.startsWith("seller_");
          redisKey = isSeller
            ? `online:seller:${registeredUserId.replace("seller_", "")}`
            : `online:user:${registeredUserId.replace("user_", "")}`;

          await redis.set(redisKey, "1", "EX", 30);

          updateLastPong = startHeartbeat(ws, redisKey);

          return;
        }

        // 🧾 Step 2 — Parse JSON payload, sudah bukan handshake lagi (sudah pasti JSON tapi stringfy)
        let data: IncomingMessage;
        try {
          data = JSON.parse(messageStr);
        } catch {
          console.warn("⚠️ Invalid JSON message:", messageStr);
          return;
        }

        // 🧠 Step 3 — Handle basic event types
        if (data.type === "PONG" && redisKey && updateLastPong) {
          updateLastPong(Date.now());
          // update Redis TTL 30 detik
          await redis.set(redisKey, "1", "EX", 30);
          return;
        }

        // Menghapus jumlah count ketika (select chat)
        if (data.type === "MARK_AS_SEEN" && registeredUserId) {
          await clearUnseenCount(data.senderType, data.conversationId);

          console.log(
            `👁️ Marked as seen: ${data.senderType}_${data.conversationId}`
          );

          // Lanjut ke bawah, karena hanya keluar dari blok switch bukan fungsi.
          // Kirim ke client untuk ubah status seen dan jumlah count saat ini
          // Menerima dari user, kirim ke seller dan sebaliknya
          const reciverType = data.senderType === "user" ? "seller" : "user";
          const receiverSocket = connectedUsers.get(
            `${reciverType}_${data.conversationId}`
          ); // dalam bentuk ws milik di receiver nya

          // Kirim ke lawan bicara seharusnya
          if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
            receiverSocket.send(
              JSON.stringify({
                type: "UNSEEN_COUNT_UPDATE",
                payload: { conversationId: data.conversationId, count: 0, status: "seen" },
              })
            );
            console.log(
              `👁️ Sent unseen update to online receiver: ${reciverType}_${data.toUserId}`
            );
          } 

          return;
        }

        // Validasi jika selain type yg ada
        if (data.type !== "MESSAGE") {
          console.warn("⚠️ Unknown message type:", data.type);
          return;
        }

        // 🧩 Step 4 — Validate message content || ambil data.type "MESSAGE"
        const { fromUserId, toUserId, content, conversationId, senderType } =
          data;
        if (!fromUserId || !toUserId || !conversationId || !content) {
          console.warn("⚠️ Incomplete message payload:", data);
          return;
        }

        const now = new Date().toISOString();

        // 📨 Step 5 — Construct message || Menerima dari client
        const messagePayload = {
          conversationId,
          senderId: fromUserId,
          senderType,
          content,
          createdAt: now,
        };
        const unseenCount = await getUnseenCount(senderType, conversationId);
        // Untuk dikirim ke client
        const messageEvent = JSON.stringify({
          type: "NEW_MESSAGE",
          payload: { ...messagePayload, tempId: data.tempId || null, count: unseenCount },
        });

        const receiverKey =
          senderType === "user" ? `seller_${toUserId}` : `user_${toUserId}`;
        const senderKey =
          senderType === "user" ? `user_${fromUserId}` : `seller_${fromUserId}`;

        console.log("➡️ Sender:", senderKey, "| Receiver:", receiverKey);
        console.log("👥 Connected:", Array.from(connectedUsers.keys()));

        // 📬 Step 6 — Deliver to receiver (if online) and update unseen_count
        const receiverSocket = connectedUsers.get(receiverKey);
        if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
          receiverSocket.send(messageEvent);
          console.log(`📤 Delivered message to ${senderType}`);
        } else {
          connectedUsers.delete(receiverKey); // hapus socket lama/offline
          console.log(`🕓 ${receiverKey} offline — queued.`);
        }

        // ✅ Step 7 — Send ACK to sender
        const senderSocket = connectedUsers.get(senderKey);
        if (senderSocket?.readyState === WebSocket.OPEN) {
          senderSocket.send(
            JSON.stringify({
              type: "MESSAGE_ACK",
              payload: {
                conversationId,
                tempId: data.tempId,
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
      if (!registeredUserId || !redisKey) return;
      connectedUsers.delete(registeredUserId);
      await redis.del(redisKey);
      console.log(`🔌 Disconnected: ${registeredUserId}`);
    });

    ws.on("error", (err) => {
      console.error("⚠️ WebSocket error:", err);
    });
  });

  console.log("🟢 WebSocket server is ready");
}
