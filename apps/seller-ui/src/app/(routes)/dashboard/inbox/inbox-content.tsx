"use client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/context/web-socket-context";
import useSeller from "@/hook/useSeller";
import ChatInput from "@/shared/component/chats/chatinput";
import { AVATAR_IMAGE_PLACEHOLDER } from "@/shared/constant";
import axiosInstance from "@/utils/axiosInstance";
import { isProtected } from "@/utils/protected";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useChatSync } from "@/hook/useChatSync";

export const SellerInboxContent = () => {
  const { seller } = useSeller();
  const { ws, isOnline } = useWebSocket() || {};
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");

  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  // ✅ Real-time sync dari hook khusus
  useChatSync((conversationId as string) || undefined);

  /** -------------------------------------------
   * 🧭 Ambil daftar percakapan
   * ------------------------------------------- */
  const {
    data: chats = [],
    isLoading,
  } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/chatting/api/get-seller-conversations",
        isProtected
      );
      return res.data.conversation;
    },
  });

  /** -------------------------------------------
   * 💬 Ambil pesan berdasarkan conversationId
   * ------------------------------------------- */
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await axiosInstance.get(
        `/chatting/api/get-messages/${conversationId}?page=1`,
        isProtected
      );
      setPage(1);
      setHasMore(res.data.hasMore);
      return res.data.messages.reverse();
    },
    enabled: !!conversationId,
    staleTime: Infinity,
  });

  /** -------------------------------------------
   * 📤 Pilih dan buka percakapan
   * ------------------------------------------- */
  const handleSelectChat = (chat: any) => {
    setSelectedChat(chat);
    router.push(`?conversationId=${chat.conversationId}`);

    // Tandai sebagai "sudah dilihat"
    ws?.send(
      JSON.stringify({
        type: "MARK_AS_SEEN",
        conversationId: chat.conversationId,
        senderType: "seller",
        toUserId: chat.buyer.id,
      })
    );

    queryClient.setQueryData(["conversations"], (old: any = []) =>
      old.map((c: any) =>
        c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c
      )
    );

    // Update list pesan (status seen)
    queryClient.setQueryData(
      ["messages", chat.conversationId],
      (old: any = []) =>
        old.map((msg: any) =>
          msg.senderType === "seller" ? { ...msg, status: "seen" } : msg
        )
    );
  };

  /** -------------------------------------------
   * ✉️ Kirim pesan
   * ------------------------------------------- */
  const handleSendMessage = (e: any) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const payload = {
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "MESSAGE",
      fromSellerId: seller?.id,
      toUserId: selectedChat.buyer.id,
      conversationId: selectedChat.conversationId,
      content: message,
      senderType: "seller",
    };

    // Kirim ke server via WebSocket
    ws?.send(JSON.stringify(payload));

    // Tambahkan pesan ke cache sementara (status sending)
    queryClient.setQueryData(
      ["messages", selectedChat.conversationId],
      (old: any = []) => [...old, { ...payload, status: "sending" }]
    );

    // Update list percakapan (lastMessage)
    queryClient.setQueryData(["conversations"], (old: any = []) =>
      old.map((chat: any) =>
        chat.conversationId === selectedChat.conversationId
          ? { ...chat, lastMessage: payload.content, lastMessageAt: new Date() }
          : chat
      )
    );

    setMessage("");
    scrollToBottom();
  };

  /** -------------------------------------------
   * 📜 Load pesan lama
   * ------------------------------------------- */
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId) return;
    const nextPage = page + 1;
    const res = await axiosInstance.get(
      `/chatting/api/get-messages/${conversationId}?page=${nextPage}`,
      isProtected
    );

    queryClient.setQueryData(["messages", conversationId], (old: any = []) => [
      ...res.data.messages.reverse(),
      ...old,
    ]);

    setPage(nextPage);
    setHasMore(res.data.hasMore);
  }, [page, conversationId, queryClient]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages]);

  const getLastMessage = (chat: any) => chat?.lastMessage || "";
  const getLastMessageAt = (chat: any) => new Date(chat?.lastMessageAt) || "";

  return (
    <div className="w-full">
      <div className="md:w-[80%] mx-auto pt-5">
        <div className="flex h-[80vh] shadow-sm overflow-hidden">
          {/* Sidebar */}
          <aside className="w-[320px] border-r border-gray-200 bg-gray-50">
            <div className="p-4 border-b text-lg font-semibold text-gray-800">
              Messages
            </div>
            <div className="divide-y">
              {isLoading ? (
                <p className="p-4 text-sm text-gray-500">Loading ...</p>
              ) : chats.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No Conversation</p>
              ) : (
                chats.map((chat: any) => {
                  const isActive =
                    selectedChat?.conversationId === chat.conversationId;
                  return (
                    <button
                      key={chat.conversationId}
                      onClick={() => handleSelectChat(chat)}
                      className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition ${
                        isActive ? "bg-blue-100" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={chat.buyer.avatar || AVATAR_IMAGE_PLACEHOLDER}
                          alt={chat.buyer.name}
                          width={40}
                          height={40}
                          className="rounded-full border object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">
                              {chat.buyer.name}
                            </span>
                            {chat.unreadCount > 0 && (
                              <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                <p className="text-xs">{chat.unreadCount}</p>
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500 truncate max-w-[170px]">
                              {getLastMessage(chat)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {getLastMessageAt(chat).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Chat Area */}
          <main className="flex flex-col flex-1 bg-gray-100">
            {selectedChat ? (
              <>
                {/* Header */}
                <div className="p-4 border-b bg-white flex items-center gap-3">
                  <Image
                    src={selectedChat.buyer.avatar || AVATAR_IMAGE_PLACEHOLDER}
                    alt={selectedChat.buyer.name}
                    width={40}
                    height={40}
                    className="rounded-full border object-cover"
                  />
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">
                      {selectedChat.buyer.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div
                  ref={messageContainerRef}
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-4 text-sm"
                >
                  {hasMore && (
                    <div className="flex justify-center mb-2">
                      <button
                        onClick={loadMoreMessages}
                        className="text-xs px-4 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                      >
                        Load previous messages
                      </button>
                    </div>
                  )}

                  {messages.map((msg: any, index: number) => (
                    <div
                      key={index}
                      className={`flex flex-col ${
                        msg.senderType === "seller"
                          ? "items-end ml-auto"
                          : "items-start"
                      } max-w-[80%]`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg shadow-sm w-fit ${
                          msg.senderType === "seller"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-800"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1">
                        {msg.createdAt &&
                          new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        {msg.status === "sending" && (
                          <span className="text-[10px] text-gray-500">
                            Sending
                          </span>
                        )}
                      </span>
                    </div>
                  ))}

                  <div ref={scrollAnchorRef} />
                </div>

                {/* Input */}
                <ChatInput
                  message={message}
                  setMessage={setMessage}
                  onSendMessage={handleSendMessage}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Select a conversation to start chatting
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
