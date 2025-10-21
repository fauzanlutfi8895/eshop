"use client";

import React, { useEffect, useRef, useState, FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

import { useWebSocket } from "apps/user-ui/src/context/web-socket-context";
import useRequireAuth from "apps/user-ui/src/hooks/useRequiredAuth";
import { useChatSync } from "apps/user-ui/src/hooks/useChatSync";
import ChatInput from "apps/user-ui/src/shared/components/chats/chatinput";
import axiosInstance from "apps/user-ui/src/utils/axiosInstance";
import { isProtected } from "apps/user-ui/src/utils/protected";
import { AVATAR_IMAGE_PLACEHOLDER } from "apps/user-ui/src/shared/constant";

/* ---------------------- Types ---------------------- */
interface Message {
  id?: string;
  tempId?: string;
  conversationId: string;
  senderType: "user" | "seller";
  content: string;
  createdAt: string;
  seen?: boolean;
  acked?: boolean;
}

interface Chat {
  conversationId: string;
  lastMessage?: string;
  unreadCount?: number;
  seller: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
  };
}

/* ---------------------- Main Component ---------------------- */
const ChatPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conversationId = searchParams.get("conversationId");

  const queryClient = useQueryClient();
  const { ws } = useWebSocket() || {};
  const { user, isLoading: userLoading } = useRequireAuth();

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);

  /* ---------------------- Hooks ---------------------- */
  useChatSync(conversationId || undefined);

  /* ---------------------- Queries ---------------------- */
  const { data: conversations = [], isLoading: conversationsLoading } =
    useQuery({
      queryKey: ["conversations"],
      queryFn: async () => {
        const res = await axiosInstance.get(
          "/chatting/api/get-user-conversations",
          isProtected
        );
        return res.data.conversations as Chat[];
      },
    });

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId || hasFetchedOnce) return [];
      const res = await axiosInstance.get(
        `/chatting/api/get-messages/${conversationId}?page=1`,
        isProtected
      );
      setPage(1);
      setHasMore(res.data.hasMore);
      setHasFetchedOnce(true);
      return res.data.messages.reverse() as Message[];
    },
    enabled: !!conversationId,
    staleTime: Infinity,
  });

  /* ---------------------- Handlers ---------------------- */
  const handleSelectChat = (chat: Chat) => {
    setHasFetchedOnce(false);
    router.push(`?conversationId=${chat.conversationId}`);

    queryClient.setQueryData(["conversations"], (old: Chat[] = []) =>
      old.map((c) =>
        c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c
      )
    );

    ws?.send(
      JSON.stringify({
        type: "MARK_AS_SEEN",
        conversationId: chat.conversationId,
      })
    );
  };

  /* ---------------------- Handle Send Message ---------------------- */
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const tempId = crypto.randomUUID();
    const payload: Message = {
      tempId,
      conversationId: selectedChat.conversationId,
      senderType: "user",
      content: message,
      createdAt: new Date().toISOString(),
      acked: false, // belum diack oleh server
    };

    // Kirim ke server via WebSocket
    ws?.send(
      JSON.stringify({
        type: "MESSAGE",
        ...payload,
        fromUserId: user?.id,
        toUserId: selectedChat.seller.id,
      })
    );

    // Tambahkan pesan ke cache sementara (status sending)
    queryClient.setQueryData(
      ["messages", selectedChat.conversationId],
      (old: Message[] = []) => [...old, { ...payload, status: "sending" }]
    );

    // Update list percakapan (lastMessage)
    queryClient.setQueryData(["conversations"], (old: Chat[] = []) =>
      old.map((chat) =>
        chat.conversationId === selectedChat.conversationId
          ? { ...chat, lastMessage: payload.content }
          : chat
      )
    );

    setMessage("");
    scrollToBottom();
  };

  const loadMoreMessages = async () => {
    if (!conversationId) return;
    const nextPage = page + 1;
    const res = await axiosInstance.get(
      `/chatting/api/get-messages/${conversationId}?page=${nextPage}`,
      isProtected
    );

    queryClient.setQueryData(
      ["messages", conversationId],
      (old: Message[] = []) => [...res.data.messages.reverse(), ...old]
    );

    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  /* ---------------------- Effects ---------------------- */
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const chat =
        conversations.find((c) => c.conversationId === conversationId) || null;
      setSelectedChat(chat);
    }
  }, [conversationId, conversations]);

  /** -------------------------------------------
   * 🧭 Handle Event WebSocket (Real-time Updates)
   * ------------------------------------------- */
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      const { type, payload } = data;

      if (type === "NEW_MESSAGE") {
        queryClient.setQueryData(
          ["messages", payload.conversationId],
          (old: any = []) => {
            return [...old, payload];
          }
        );

        // Update last message
        queryClient.setQueryData(["conversations"], (old: any = []) =>
          old.map((chat: any) =>
            chat.conversationId === payload.conversationId
              ? { ...chat, lastMessage: payload.content }
              : chat
          )
        );

        if (payload.conversationId === conversationId) {
          scrollToBottom();
        }
      }

      if (type === "UNSEEN_COUNT_UPDATE") {
        queryClient.setQueryData(["conversations"], (old: any = []) =>
          old.map((chat: any) =>
            chat.conversationId === payload.conversationId
              ? { ...chat, unreadCount: payload.count }
              : chat
          )
        );
      }

      if (type === "MESSAGE_ACK") {
        queryClient.setQueryData(
          ["messages", payload.conversationId],
          (old: any = []) =>
            old.map((msg: any) =>
              msg.tempId === payload.tempId ? { ...msg, acked: true } : msg
            )
        );
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, queryClient]);

  /* ---------------------- UI ---------------------- */
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
              {conversationsLoading ? (
                <p className="p-4 text-sm text-gray-500">Loading ...</p>
              ) : conversations.length === 0 ? (
                <p className="p-4 text-sm text-gray-500">No Conversation</p>
              ) : (
                conversations.map((chat) => {
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
                          src={chat.seller.avatar || AVATAR_IMAGE_PLACEHOLDER}
                          alt={chat.seller.name}
                          width={40}
                          height={40}
                          className="rounded-full border object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">
                              {chat.seller.name}
                            </span>
                            {chat.seller.isOnline && (
                              <span className="w-2 h-2 rounded-full bg-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate max-w-[170px]">
                            {chat.lastMessage || ""}
                          </p>
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
                    src={selectedChat.seller.avatar || AVATAR_IMAGE_PLACEHOLDER}
                    alt={selectedChat.seller.name}
                    width={40}
                    height={40}
                    className="rounded-full border object-cover"
                  />
                  <div>
                    <h2 className="text-base font-semibold text-gray-800">
                      {selectedChat.seller.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {selectedChat.seller.isOnline ? "Online" : "Offline"}
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

                  {messages.map((msg, index) => (
                    <div
                      key={msg.id || msg.tempId || index}
                      className={`flex flex-col ${
                        msg.senderType === "user"
                          ? "items-end ml-auto"
                          : "items-start"
                      } max-w-[80%]`}
                    >
                      <div
                        className={`px-4 py-2 rounded-lg shadow-sm w-fit ${
                          msg.senderType === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-white text-gray-800"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[11px] text-gray-400 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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

export default ChatPage;
