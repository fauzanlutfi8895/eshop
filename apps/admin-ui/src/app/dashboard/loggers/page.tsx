"use client";

import React, { useEffect, useState, useRef } from "react";
import Breadcrumb from "@/shared/components/breadcrumbs";
import { Download } from "lucide-react";

type LogType = "success" | "info" | "warning" | "error" | "debug";

type LogItem = {
  type: LogType;
  message: string;
  timestamp: string;
  source?: string;
};

const typeColorMap: Record<LogType, string> = {
  success: "text-green-400",
  info: "text-blue-300",
  warning: "text-yellow-300",
  error: "text-red-500",
  debug: "text-gray-400",
};

const page = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogItem[]>([]);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = new WebSocket(process.env.NEXT_PUBLIC_SOCKET_URI!);

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        setLogs((prev) => [...prev, parsed]);
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    return () => socket.close();
  }, []);

  // Auto-scroll to bottom on new logs
  useEffect(() => {
    setFilteredLogs(logs);

    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle key press for filtering
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "1") {
        setFilteredLogs(logs.filter((log) => log.type === "error"));
      } else if (e.key === "2") {
        setFilteredLogs(logs.filter((log) => log.type === "success"));
      } else if (e.key === "0") {
        setFilteredLogs(logs);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [logs]);

  // Download logs as .log file
  const downloadLogs = () => {
    const content = filteredLogs
      .map(
        (log) =>
          `[${new Date(log.timestamp).toLocaleTimeString()}] ${
            log.source
          } [${log.type.toUpperCase()}] ${log.message}`
      )
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `application-logs.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full min-h-screen p-8 bg-black text-white text-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold tracking-wide">Application Logs</h2>
        <button
          onClick={downloadLogs}
          className="flex items-center justify-center px-3 py-2 gap-1 text-sm text-white bg-gray-700 rounded-md hover:bg-gray-500 transition"
        >
          <Download size={18} />
          Download Logs
        </button>
      </div>

      {/* Breadcrumbs */}
      <div className="mb-4">
        <Breadcrumb title="Application Logs" />
      </div>

      {/* Terminal log stream */}
      <div
        ref={logContainerRef}
        className="bg-black font-mono border border-gray-800 rounded-md p-4 h-[600px] overflow-y-auto"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500">Waiting for logs...</div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className="whitespace-pre-wrap">
              <span className="text-gray-500">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>{" "}
              <span className="text-purple-400">{log.source}</span>{" "}
              <span className={typeColorMap[log.type]}>
                [{log.type.toUpperCase()}]
              </span>{" "}
              <span>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default page;
