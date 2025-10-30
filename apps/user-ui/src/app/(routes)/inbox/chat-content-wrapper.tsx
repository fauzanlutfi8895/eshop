"use client";

import dynamic from "next/dynamic";

// Dynamic import to prevent SSR issues with client-only hooks
const ChatContent = dynamic(
  () => import("./chat-content").then((mod) => mod.ChatContent),
  {
    ssr: false,
    loading: () => (
      <div className="w-full">
        <div className="md:w-[80%] mx-auto pt-5">
          <div className="flex h-[80vh] shadow-sm overflow-hidden">
            <aside className="w-[320px] border-r border-gray-200 bg-gray-50">
              <div className="p-4 border-b text-lg font-semibold text-gray-800">
                Messages
              </div>
              <div className="p-4 text-sm text-gray-500">Loading...</div>
            </aside>
            <main className="flex flex-col flex-1 bg-gray-100 items-center justify-center">
              <p className="text-gray-400">Loading...</p>
            </main>
          </div>
        </div>
      </div>
    ),
  }
);

export function ChatContentWrapper() {
  return <ChatContent />;
}
