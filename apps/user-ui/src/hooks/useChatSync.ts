"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useChatSync(conversationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleWsEvent = (event: any) => {
      const data = event.detail;

      // Jika bukan pesan baru, abaikan
      if (data.type !== "NEW_MESSAGE") return;

      const message = data.payload;

      // Update cache pesan aktif
      if (message.conversationId === conversationId) {
        queryClient.setQueryData(
          ["messages", conversationId],
          (old: any = []) => [...old, message]
        );
      }

      // Update daftar percakapan (last message, unread count)
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
    };

    window.addEventListener("ws:event", handleWsEvent);
    return () => window.removeEventListener("ws:event", handleWsEvent);
  }, [conversationId, queryClient]);
}
