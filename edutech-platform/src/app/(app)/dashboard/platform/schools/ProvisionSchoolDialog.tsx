"use client";

import { useState } from "react";

import { provisionSchoolAction } from "@/app/(app)/dashboard/platform/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Dialog } from "@/components/ui/Overlays";

export function ProvisionSchoolDialog() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Tạo trường mới</Button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Khởi tạo trường" description="Thao tác ở phạm vi nền tảng. Quản trị viên trường sẽ nhận lời mời qua email.">
        <form action={provisionSchoolAction} className="space-y-5">
          <Field id="school-name" label="Tên đầy đủ" required><Input id="school-name" name="name" required minLength={3} /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="school-short-name" label="Tên rút gọn" required><Input id="school-short-name" name="shortName" required minLength={2} /></Field>
            <Field id="school-slug" label="Định danh" required description="Chữ thường, số và dấu gạch ngang."><Input id="school-slug" name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></Field>
          </div>
          <Field id="admin-email" label="Email quản trị viên trường" required><Input id="admin-email" name="adminEmail" type="email" required /></Field>
          <div className="flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Hủy</Button><Button type="submit">Khởi tạo và gửi lời mời</Button></div>
        </form>
      </Dialog>
    </>
  );
}
