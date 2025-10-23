"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

interface WebSocketContextValue {
  ws: WebSocket | null;
  isOnline: boolean;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  ws: null,
  isOnline: false,
});

export const WebSocketProvider = ({
  children,
  seller,
}: {
  children: React.ReactNode;
  seller: any;
}) => {
  const wsRef = useRef<(WebSocket & { _heartbeat?: NodeJS.Timeout }) | null>(
    null
  ); //menyimpan seperti state, tapi tidak adak berubah ketika render dan tidak memicu render ulang ketika berubah (refresh akan connect ulang)
  const [isOnline, setIsOnline] = useState(false); // untuk indikator UI

  const lastPongRef = useRef(Date.now());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmounted = useRef(false);

  const createWebSocket = () => {
    if (!seller?.id) return;

    // 🚧 Jika sudah ada koneksi aktif dan belum tertutup, jangan buat lagi
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
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

    // ✅ Buat koneksi baru alias buat koneksi, mulai connecting
    const ws = new WebSocket(wsUrl) as WebSocket & {
      _heartbeat?: NodeJS.Timeout;
    };
    wsRef.current = ws;

    // onopen artinya status nya sudah tehubung, dan kalau ingin mengirim ke server gunakan send
    ws.onopen = () => {
      // send artinya kirim pesan ke server
      // Untuk identifikasi awal (wajib supaya tidak terkirim ke lain)
      console.log("✅ WebSocket connected:", seller.id);
      ws.send(`seller_${seller.id}`);
      lastPongRef.current = Date.now();
      // set online true dan start heartbeat
      setIsOnline(true);
    };

    // onmessage artinya menerima dari server, jadi send nggak benar disini
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 🚫 Validasi isi pesan — cegah penyimpanan pesan tanpa content
        if (!data.content && !data.type) {
          console.warn("⚠️ Invalid WebSocket message ignored:", data);
          return;
        }

        // aman karena satu event hanya satu type
        if (data.type === "PING") {
          ws.send(JSON.stringify({ type: "PONG" }));
          lastPongRef.current = Date.now();
          return;
        }
        
        // Broadcast ke window listener
        window.dispatchEvent(new CustomEvent("ws:event", { detail: data }));
      } catch (err) {
        console.warn("⚠️ Failed to parse WebSocket message:", event.data);
      }
    };

    ws.onclose = () => {
      console.warn("❌ WebSocket disconnected");
      setIsOnline(false);
      if (ws._heartbeat) clearInterval(ws._heartbeat);

      // Coba auto reconnect setelah 3 detik
      if (!reconnectTimeoutRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectTimeoutRef.current = null;
          createWebSocket();
        }, 3000);
      }
    };

    ws.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
      ws.close();
    };

    // 4️⃣ Heartbeat check (cek PONG dari server)
    ws._heartbeat = setInterval(() => {
      if (Date.now() - lastPongRef.current > 30000) {
        console.warn("⚠️ No PONG from server, reconnecting...");
        setIsOnline(false);
        ws.close();
      }
    }, 25000);
  };

  // -------------------- Effect --------------------
  useEffect(() => {
    isUnmounted.current = false;
    createWebSocket();

    return () => {
      isUnmounted.current = true;
      if (reconnectTimeoutRef.current)
        clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current?._heartbeat) clearInterval(wsRef.current._heartbeat);
      wsRef.current?.close();
    };
  }, [seller?.id]);

  return (
    <WebSocketContext.Provider
      value={{ ws: wsRef.current, isOnline }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = (): WebSocketContextValue => useContext(WebSocketContext);
