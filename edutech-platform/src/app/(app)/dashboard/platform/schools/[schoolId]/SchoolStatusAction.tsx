"use client";

import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";

import {
  restoreSchoolAction,
  suspendSchoolAction,
} from "@/app/(app)/dashboard/platform/actions";
import { Button } from "@/components/ui/Button";
import type { SchoolStatus } from "@/generated/prisma/enums";

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export function SchoolStatusAction({
  schoolId,
  status,
}: {
  schoolId: string;
  status: SchoolStatus;
}) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const [currentStatus, setCurrentStatus] = useState(status);
  const [pending, setPending] = useState(false);
  const isActive = currentStatus === "ACTIVE";

  async function updateStatus(formData: FormData) {
    setPending(true);
    try {
      if (isActive) {
        await suspendSchoolAction(formData);
      } else {
        await restoreSchoolAction(formData);
      }
      setCurrentStatus(isActive ? "SUSPENDED" : "ACTIVE");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={updateStatus}>
      <input type="hidden" name="schoolId" value={schoolId} />
      <Button
        type="submit"
        variant={isActive ? "danger" : "primary"}
        disabled={!hydrated || pending}
      >
        {pending
          ? "Đang cập nhật..."
          : isActive
            ? "Tạm dừng trường"
            : "Khôi phục trường"}
      </Button>
    </form>
  );
}
