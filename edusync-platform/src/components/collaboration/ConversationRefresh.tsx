"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

export function ConversationRefresh({ streamUrl }: { streamUrl: string }) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [live, setLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const refresh = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("sync", Date.now().toString());
    router.replace(`${url.pathname}${url.search}`, { scroll: false });
    setUpdatedAt(new Date());
  }, [router]);

  useEffect(() => {
    const updateConnection = () => {
      const connected = navigator.onLine;
      setOnline(connected);
      if (!connected) setLive(false);
    };
    updateConnection();
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    const timer = window.setInterval(() => {
      const activeElement = document.activeElement;
      if (
        document.visibilityState !== "visible" ||
        activeElement?.matches("input, textarea, select")
      ) {
        return;
      }
      refresh();
    }, 8_000);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, [refresh]);

  useEffect(() => {
    if (!online || typeof EventSource === "undefined") {
      return;
    }
    const source = new EventSource(streamUrl);
    const ready = () => setLive(true);
    const update = () => {
      setLive(true);
      refresh();
    };
    source.addEventListener("ready", ready);
    source.addEventListener("update", update);
    source.onerror = () => setLive(false);
    return () => {
      source.removeEventListener("ready", ready);
      source.removeEventListener("update", update);
      source.close();
    };
  }, [online, refresh, streamUrl]);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-500)]">
      <span role="status" aria-live="polite">
        {online
          ? `${live ? "Cập nhật trực tiếp" : "Đang kết nối · chế độ dự phòng 8 giây"}${
              updatedAt ? ` · ${updatedAt.toLocaleTimeString("vi-VN")}` : ""
            }`
          : "Mất kết nối · tin đã gửi vẫn được lưu khi kết nối lại"}
      </span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={refresh}
      >
        Làm mới
      </Button>
    </div>
  );
}
