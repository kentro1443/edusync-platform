"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  submitDemoRequest,
  type DemoRequestState,
} from "@/app/(marketing)/demo/actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/icons";

const moduleOptions = [
  { value: "mentoring", label: "Cố vấn & Gia sư" },
  { value: "resources", label: "Kho tài liệu" },
  { value: "appointments", label: "Lịch hẹn & Đơn từ" },
  { value: "workflows", label: "Quy trình số" },
  { value: "clubs-events", label: "CLB, Sự kiện & Cơ sở vật chất" },
  { value: "all", label: "Toàn bộ 5 mô-đun" },
];

const initialState: DemoRequestState = { status: "idle" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" loading={pending}>
      Gửi yêu cầu tư vấn
    </Button>
  );
}

export function DemoForm() {
  const [state, formAction] = useActionState(submitDemoRequest, initialState);

  if (state.status === "success") {
    return (
      <Card
        role="status"
        aria-live="polite"
        className="mx-auto flex max-w-xl flex-col items-center gap-4 py-14 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-50)] text-[var(--color-success-600)]">
          <CheckIcon width={28} height={28} aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold text-[var(--color-ink-900)]">
          Yêu cầu đã được ghi nhận
        </h2>
        <p className="max-w-sm text-sm leading-6 text-[var(--color-ink-500)]">
          Đội ngũ EduSync sẽ kiểm tra thông tin và liên hệ trong vòng 24 giờ làm việc.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <form action={formAction} className="space-y-5" noValidate>
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor="website">Website</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        {state.formError ? (
          <Alert tone="danger" title="Chưa gửi được yêu cầu">
            {state.formError}
          </Alert>
        ) : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="fullName" label="Họ và tên" required error={state.fieldErrors?.fullName}>
            <Input id="fullName" name="fullName" autoComplete="name" placeholder="Nguyễn Văn An" />
          </Field>
          <Field id="role" label="Vai trò" required error={state.fieldErrors?.role}>
            <Select id="role" name="role" defaultValue="">
              <option value="" disabled>Chọn vai trò</option>
              <option value="principal">Ban giám hiệu</option>
              <option value="it">Phòng công nghệ thông tin</option>
              <option value="teacher">Giáo viên</option>
              <option value="other">Vai trò khác</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="school" label="Tên trường" required error={state.fieldErrors?.schoolName}>
            <Input id="school" name="school" autoComplete="organization" placeholder="THPT Minh Khai" />
          </Field>
          <Field id="email" label="Email công vụ" required error={state.fieldErrors?.email}>
            <Input id="email" name="email" type="email" autoComplete="email" placeholder="ban@truong.edu.vn" />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="phone" label="Số điện thoại" error={state.fieldErrors?.phone}>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0901 234 567" />
          </Field>
          <Field id="studentCount" label="Quy mô học sinh" error={state.fieldErrors?.studentCount}>
            <Input id="studentCount" name="studentCount" type="number" inputMode="numeric" min={1} max={100000} placeholder="1500" />
          </Field>
        </div>

        <Field id="modules" label="Mô-đun quan tâm" required error={state.fieldErrors?.modules}>
          <Select id="modules" name="modules" defaultValue="">
            <option value="" disabled>Chọn mô-đun</option>
            {moduleOptions.map((module) => (
              <option key={module.value} value={module.value}>{module.label}</option>
            ))}
          </Select>
        </Field>

        <Field id="message" label="Vấn đề nhà trường cần giải quyết" error={state.fieldErrors?.message}>
          <Textarea id="message" name="message" maxLength={2000} placeholder="Chia sẻ ngắn gọn thách thức mà nhà trường đang đối mặt..." />
        </Field>

        <SubmitButton />
        <p className="text-center text-xs leading-5 text-[var(--color-ink-400)]">
          Khi gửi biểu mẫu, bạn đồng ý để EduSync sử dụng thông tin này nhằm liên hệ tư vấn triển khai.
        </p>
      </form>
    </Card>
  );
}
