"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  inviteMemberAction,
  updateRolesAction,
} from "@/app/(app)/dashboard/admin/actions";
import { translateRole } from "@/components/app/shell-utils";
import { Button } from "@/components/ui/Button";
import { Checkbox, Field, Input } from "@/components/ui/Field";
import { Dialog } from "@/components/ui/Overlays";
import type { SchoolRole } from "@/generated/prisma/enums";

const assignableRoles: SchoolRole[] = [
  "SCHOOL_ADMIN",
  "TEACHER_STAFF",
  "MENTOR_COUNSELOR",
  "STUDENT",
  "PARENT_GUARDIAN",
  "CLUB_LEADER",
  "APPROVER_REVIEWER",
];

function RoleCheckboxes({
  selected = [],
  locked = [],
}: {
  selected?: readonly SchoolRole[];
  locked?: readonly SchoolRole[];
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-[var(--color-ink-800)]">Vai trò được cấp</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {assignableRoles.map((role) => {
          const isLocked = locked.includes(role);
          const isSelected = selected.includes(role);
          return (
            <div key={role}>
              {isLocked && isSelected ? <input type="hidden" name="roles" value={role} /> : null}
              <Checkbox
                name="roles"
                value={role}
                defaultChecked={isSelected}
                disabled={isLocked}
                label={<>{translateRole(role)}{isLocked ? <span className="mt-0.5 block text-xs font-normal text-[var(--color-ink-500)]">Không thể tự gỡ vai trò này</span> : null}</>}
                className={`min-h-11 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] px-3 py-2${isLocked ? " bg-[var(--color-ink-50)] opacity-75" : ""}`}
              />
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export function InviteMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function inviteMember(formData: FormData) {
    const status = await inviteMemberAction(formData);
    setOpen(false);
    router.replace(`/dashboard/admin/members?result=${status}`);
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Mời thành viên</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Mời thành viên" description="Lời mời có hiệu lực 7 ngày và có thể thu hồi bất cứ lúc nào.">
        <form action={inviteMember} className="space-y-5">
          <Field id="invite-email" label="Email người nhận" required>
            <Input id="invite-email" name="email" type="email" autoComplete="email" required />
          </Field>
          <RoleCheckboxes />
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit">Gửi lời mời</Button></div>
        </form>
      </Dialog>
    </>
  );
}

export function RoleAssignmentDialog({
  membershipId,
  displayName,
  roles,
  lockSchoolAdmin = false,
}: {
  membershipId: string;
  displayName: string;
  roles: SchoolRole[];
  lockSchoolAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  async function saveRoles(formData: FormData) {
    await updateRolesAction(formData);
    setOpen(false);
  }

  return (
    <>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>Phân quyền</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title={`Phân quyền cho ${displayName}`} description="Thay đổi có hiệu lực ngay trong trường đang hoạt động.">
        <form action={saveRoles} className="space-y-5">
          <input type="hidden" name="membershipId" value={membershipId} />
          <RoleCheckboxes selected={roles} locked={lockSchoolAdmin ? ["SCHOOL_ADMIN"] : []} />
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit">Lưu vai trò</Button></div>
        </form>
      </Dialog>
    </>
  );
}
