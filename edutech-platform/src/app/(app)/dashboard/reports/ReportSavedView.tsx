"use client";

import { useEffect, useState } from "react";

import { Button, LinkButton } from "@/components/ui/Button";

export function ReportSavedView({
  storageKey,
  currentHref,
}: Readonly<{ storageKey: string; currentHref: string }>) {
  const [savedHref, setSavedHref] = useState<string>();
  const [status, setStatus] = useState("");

  useEffect(() => {
    const raf = requestAnimationFrame(() =>
      setSavedHref(window.localStorage.getItem(storageKey) ?? undefined),
    );
    return () => cancelAnimationFrame(raf);
  }, [storageKey]);

  function save() {
    window.localStorage.setItem(storageKey, currentHref);
    setSavedHref(currentHref);
    setStatus("Đã lưu khoảng báo cáo trên thiết bị này.");
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={save}>
        Lưu bộ lọc
      </Button>
      {savedHref && savedHref !== currentHref ? (
        <LinkButton href={savedHref} variant="outline" size="sm">
          Mở bộ lọc đã lưu
        </LinkButton>
      ) : null}
      <span className="sr-only" role="status" aria-live="polite">
        {status}
      </span>
    </>
  );
}
