"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useChatSync(conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleWsEvent = (event: any) => {
      const { type, payload } = event.detail || {};

      if (!payload) return;

      // ✅ Saat pesan terkirim (ack) || yg dibaca oleh "messages"
      if (type === "MESSAGE_ACK") {
        queryClient.setQueryData(
          ["messages", payload.conversationId],
          (old: any = []) =>
            old.map((m: any) =>
              m.tempId === payload.tempId
                ? { ...m, status: "sent", createdAt: payload.timestamp }
                : m
            )
        );
      }

      // ✅ Saat pesan telah dibaca (seen)
      if (type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId, count } = payload;
        // 1️⃣ Update pesan jadi seen (khusus pesan dari seller)
        queryClient.setQueryData(
          ["messages", conversationId],
          (old: any = []) =>
            old.map((m: any) =>
              m.senderType === "user" ? { ...m, status: "seen" } : m
            )
        );

        // 2️⃣ Update juga conversation agar unreadCount sinkron
        queryClient.setQueryData(["conversations"], (old: any = []) =>
          old.map((conv: any) =>
            conv.conversationId === conversationId
              ? { ...conv, unreadCount: count }
              : conv
          )
        );

        console.log(`👁️ Queued Updated UI unseen count (user) to ${count}`);
      }

      // ✅ Saat ada pesan baru
      if (type === "NEW_MESSAGE") {
        const message = payload;
        queryClient.setQueryData(
          ["messages", message.conversationId],
          (old: any = []) => [...old, message]
        );

        queryClient.setQueryData(["conversations"], (old: any = []) =>
          old.map((conv: any) =>
            conv.conversationId === message.conversationId
              ? {
                  ...conv,
                  lastMessage: message.content,
                  unreadCount:
                    conv.conversationId === conversationId
                      ? 0
                      : (conv.unreadCount || 0) + 1,
                }
              : conv
          )
        );
      }
    };

    window.addEventListener("ws:event", handleWsEvent);
    return () => window.removeEventListener("ws:event", handleWsEvent);
  }, [conversationId, queryClient]);
}
