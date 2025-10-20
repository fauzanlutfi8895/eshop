"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useChatSync(conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleWsEvent = (event: any) => {
      const { type, payload } = event.detail || {};

      if (!payload) return;

      // ✅ Saat pesan terkirim (ack)
      if (type === "MESSAGE_ACK") {
        queryClient.setQueryData(["messages", payload.conversationId], (old: any = []) =>
          old.map((m: any) =>
            m.tempId === payload.tempId
              ? { ...m, status: "delivered", deliveredAt: payload.timestamp }
              : m
          )
        );
      }

      // ✅ Saat pesan telah dibaca (seen)
      if (type === "MESSAGE_SEEN_UPDATE") {
        queryClient.setQueryData(["messages", payload.conversationId], (old: any = []) =>
          old.map((m: any) =>
            m.senderType === "seller" ? { ...m, status: "seen" } : m
          )
        );
      }

      // ✅ Saat ada pesan baru
      if (type === "NEW_MESSAGE") {
        const message = payload;
        queryClient.setQueryData(["messages", message.conversationId], (old: any = []) => {
          const exists = old.some((o: any) => o.id === message.id);
          if (exists) return old;
          return [...old, message];
        });

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
