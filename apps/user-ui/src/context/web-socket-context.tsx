"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

const WebSocketContext = createContext<any>(null);

export const WebSocketProvider = ({
  children,
  user,
}: {
  children: React.ReactNode;
  user: any;
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const [wsReady, setWsReady] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user?.id) return;

    const ws = new WebSocket(process.env.NEXT_PUBLIC_CHATTING_WEBSOCKET_URI!);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(`user_${user.id}`);
      console.log("✅ WebSocket connected:", user.id);
      setWsReady(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "UNSEEN_COUNT_UPDATE") {
          const { conversationId, count } = data.payload;
          setUnreadCounts((prev) => ({ ...prev, [conversationId]: count }));
        } else {
          console.log("📩 Received message:", data);
        }
      } catch (err) {
        console.warn("Failed to parse message:", event.data);
      }
    };

    ws.onclose = () => {
      console.warn("❌ WebSocket disconnected");
      setWsReady(false);
    };

    ws.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
    };

    return () => {
      ws.close();
    };
  }, [user?.id]);

  return (
    <WebSocketContext.Provider
      value={{ ws: wsReady ? wsRef.current : null, unreadCounts }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
