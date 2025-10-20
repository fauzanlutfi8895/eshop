"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext<any>(null);

export const WebSocketProvider = ({
  children,
  seller,
}: {
  children: React.ReactNode;
  seller: any;
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsReady, setWsReady] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!seller?.id) return;

    // 🚧 Jika sudah ada koneksi aktif dan belum tertutup, jangan buat lagi
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      console.log(
        "⚠️ WebSocket already connected or connecting, skipping recreate."
      );
      return;
    }

    // Pastikan environment variable tersedia
    const wsUrl = process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI;
    if (!wsUrl) {
      console.error("❌ Missing NEXT_PUBLIC_CHATTING_WEBSOCKET_URI");
      return;
    }

    // ✅ Buat koneksi baru
    const ws = new WebSocket(wsUrl) as WebSocket & {
      _heartbeat?: NodeJS.Timeout;
    };
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(`seller_${seller.id}`);
      console.log("✅ WebSocket connected:", seller.id);
      setWsReady(true);

      // Heartbeat: kirim ping tiap 25 detik
      const interval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "PING" }));
        }
      }, 25000);
      ws._heartbeat = interval;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 🚫 Validasi isi pesan — cegah penyimpanan pesan tanpa content
        if (!data.content && !data.type) {
          console.warn("⚠️ Invalid WebSocket message ignored:", data);
          return;
        }

        // Broadcast ke window listener
        window.dispatchEvent(new CustomEvent("ws:event", { detail: data }));

        if (data.type === "UNSEEN_COUNT_UPDATE") {
          const { conversationId, count } = data.payload;
          setUnreadCounts((prev) => ({ ...prev, [conversationId]: count }));
        }
      } catch (err) {
        console.warn("Failed to parse message:", event.data);
      }
    };

    ws.onclose = () => {
      console.warn("❌ WebSocket disconnected");
      setWsReady(false);
      if (ws._heartbeat) clearInterval(ws._heartbeat);
    };

    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err);

    return () => {
      if (ws._heartbeat) clearInterval(ws._heartbeat);
      ws.close();
    };
  }, [seller?.id]);

  return (
    <WebSocketContext.Provider
      value={{ ws: wsReady ? wsRef.current : null, unreadCounts }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
