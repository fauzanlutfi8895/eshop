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

const SellerInboxPage = () => {
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
    error,
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
   * 💬 Ambil pesan untuk conversation aktif
   * ------------------------------------------- */
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId) return [];
      const res = await axiosInstance.get(
        `/chatting/api/get-seller-message/${conversationId}?page=1`,
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
   * 🔁 Load pesan lama (infinite scroll)
   * ------------------------------------------- */
  const loadMoreMessages = useCallback(async () => {
    if (!conversationId) return;
    const nextPage = page + 1;
    const res = await axiosInstance.get(
      `/chatting/api/get-seller-message/${conversationId}?page=${nextPage}`,
      isProtected
    );

    queryClient.setQueryData(["messages", conversationId], (old: any = []) => [
      ...res.data.messages.reverse(),
      ...old,
    ]);

    setPage(nextPage);
    setHasMore(res.data.hasMore);
  }, [page, conversationId, queryClient]);

  /** -------------------------------------------
   * ⚙️ Handle Select Chat
   * ------------------------------------------- */
  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
    router.push(`?conversationId=${chat.conversationId}`);

    // Tandai sebagai "sudah dilihat"
    ws?.send(
      JSON.stringify({
        type: "MARK_AS_SEEN",
        conversationId: chat.conversationId,
        senderType: "seller",
        toUserId: chat.user.id,
      })
    );

    // Reset unread count
    queryClient.setQueryData(["conversations"], (old: any = []) =>
      old.map((c: any) =>
        c.conversationId === chat.conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  /** -------------------------------------------
   * ✉️ Kirim pesan via WebSocket
   * ------------------------------------------- */
  const handleSend = (e: any) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;

    const payload = {
      tempId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, // tempId untuk ACK
      type: "MESSAGE",
      fromUserId: seller?.id,
      toUserId: selectedChat?.user?.id,
      conversationId: selectedChat?.conversationId,
      content: message,
      senderType: "seller",
    };

    //Menggunakan instance nya websocket context, langsung ke server
    ws?.send(JSON.stringify(payload));

    // Optimistic UI update
    queryClient.setQueryData(
      ["messages", selectedChat.conversationId],
      (old: any = []) => [...old, { ...payload, status: "sending" }]
    );

    queryClient.setQueryData(["conversations"], (old: any = []) =>
      old.map((chat: any) =>
        chat.conversationId === selectedChat.conversationId
          ? { ...chat, lastMessage: payload.content }
          : chat
      )
    );

    setMessage("");
    scrollToBottom();
  };

  /** -------------------------------------------
   * 📜 Scroll ke bawah saat pesan berubah
   * ------------------------------------------- */
  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  };

  useEffect(() => {
    if (messages.length) scrollToBottom();
  }, [messages]);

  /** -------------------------------------------
   * 💬 Render UI
   * ------------------------------------------- */
  const getLastMessage = (chat: any) => chat?.lastMessage || "";
  // const getUnreadCount = async (chat: any) => await getUnseenCount("seller", chat.conversationId);
  const getLastMessageAt = (chat: any) => new Date(chat?.lastMessageAt) || "";

  return (
    <div className="w-full min-h-screen p-8">
      <h2 className="text-2xl text-white font-semibold mb-4">Inbox</h2>
      <div className="flex h-[80vh] shadow-sm overflow-hidden">
        {/* Sidebar */}
        <div className="w-[320px] border-r border-gray-200 bg-gray-50">
          <div className="p-4 border-b border-gray-200">
            <div className="text-lg font-semibold text-gray-800">Messages</div>
          </div>
          <div className="divide-y divide-gray-300 overflow-y-auto h-full">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500">Loading ...</div>
            ) : error ? (
              <div className="p-4 text-sm text-red-500">
                Error loading conversations
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No Conversation</div>
            ) : (
              chats.map((chat: any) => {
                const isActive =
                  selectedChat?.conversationId === chat.conversationId;
                return (
                  <button
                    key={chat.conversationId}
                    onClick={() => handleChatSelect(chat)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition ${
                      isActive ? "bg-blue-100" : ""
                    }`}
                  >
                    <Image
                      src={
                        chat?.user?.avatar?.url ||
                        chat?.user?.avatar ||
                        AVATAR_IMAGE_PLACEHOLDER
                      }
                      alt={chat.user?.name || "User"}
                      width={36}
                      height={36}
                      className="rounded-full border w-[40px] h-[40px] object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-800">
                          {chat.user?.name}
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
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="flex flex-col flex-1 bg-gray-100">
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
                <Image
                  src={
                    selectedChat.user?.avatar?.url ||
                    selectedChat.user?.avatar ||
                    AVATAR_IMAGE_PLACEHOLDER
                  }
                  alt={selectedChat.user?.name || "User"}
                  width={40}
                  height={40}
                  className="rounded-full border w-[40px] h-[40px] object-cover"
                />
                <div>
                  <h2 className="font-semibold text-gray-800 text-base">
                    {selectedChat.user?.name}
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
                {messages.map((msg: any, idx: number) => (
                  <div
                    key={idx}
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
                    <div className="text-[11px] text-gray-400 mt-1">
                      {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {msg.status === "sending" && (
                        <span className="text-xs text-gray-500">Sending</span>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={scrollAnchorRef} />
              </div>

              {/* Input */}
              <ChatInput
                message={message}
                setMessage={setMessage}
                onSendMessage={handleSend}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
              Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerInboxPage;
