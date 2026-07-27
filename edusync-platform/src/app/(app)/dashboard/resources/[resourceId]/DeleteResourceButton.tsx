"use client";

import { useState } from "react";

import { deleteResourceAction } from "@/app/(app)/dashboard/resources/actions";
import { Button } from "@/components/ui/Button";

export function DeleteResourceButton({
  resourceId,
  resourceTitle,
}: Readonly<{ resourceId: string; resourceTitle: string }>) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return <Button type="button" variant="danger" size="sm" className="w-full" onClick={() => setConfirming(true)}>Xoá bài đăng</Button>;
  }

  return (
    <div role="group" aria-label={`Xác nhận xoá ${resourceTitle}`} className="space-y-3 rounded-[var(--radius-md)] border border-[var(--color-danger-200)] bg-[var(--color-danger-50)] p-4">
      <p className="text-sm font-semibold text-[var(--color-danger-800)]">Xoá “{resourceTitle}”?</p>
      <p className="text-xs leading-5 text-[var(--color-danger-700)]">Thao tác này xoá vĩnh viễn bài đăng, các phiên bản và file chỉ thuộc bài này.</p>
      <div className="flex flex-wrap gap-2">
        <form action={deleteResourceAction}>
          <input type="hidden" name="resourceId" value={resourceId} />
          <Button type="submit" variant="danger" size="sm">Xác nhận xoá</Button>
        </form>
        <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>Huỷ</Button>
      </div>
    </div>
  );
}
