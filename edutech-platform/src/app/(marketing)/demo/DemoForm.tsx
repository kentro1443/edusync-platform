"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Label, Input, Textarea, Select } from "@/components/ui/Field";
import { CheckIcon } from "@/components/ui/icons";

const moduleOptions = [
  { value: "mentoring", label: "Cố vấn & Gia sư" },
  { value: "resources", label: "Kho tài liệu" },
  { value: "appointments", label: "Lịch hẹn & Đơn từ" },
  { value: "clubs-events", label: "CLB, Sự kiện & Cơ sở vật chất" },
  { value: "all", label: "Cả 4 mô-đun" },
];

export function DemoForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="mx-auto flex max-w-xl flex-col items-center gap-4 py-14 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-success-50)] text-[var(--color-success-600)]">
          <CheckIcon width={28} height={28} />
        </span>
        <h2 className="text-xl font-semibold text-[var(--color-ink-900)]">
          Cảm ơn bạn đã đăng ký!
        </h2>
        <p className="max-w-sm text-sm text-[var(--color-ink-500)]">
          Đội ngũ của LiênKếtHọc sẽ liên hệ với bạn trong vòng 24 giờ làm
          việc để sắp xếp buổi demo phù hợp.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="fullName" required>
              Họ và tên
            </Label>
            <Input id="fullName" name="fullName" required placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <Label htmlFor="role" required>
              Vai trò
            </Label>
            <Select id="role" name="role" required defaultValue="">
              <option value="" disabled>
                Chọn vai trò
              </option>
              <option value="principal">Ban giám hiệu</option>
              <option value="it">Phòng CNTT</option>
              <option value="teacher">Giáo viên</option>
              <option value="other">Khác</option>
            </Select>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="school" required>
              Tên trường
            </Label>
            <Input id="school" name="school" required placeholder="THPT ..." />
          </div>
          <div>
            <Label htmlFor="email" required>
              Email công vụ
            </Label>
            <Input id="email" name="email" type="email" required placeholder="ban@truong.edu.vn" />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input id="phone" name="phone" type="tel" placeholder="09xx xxx xxx" />
          </div>
          <div>
            <Label htmlFor="studentCount">Quy mô học sinh</Label>
            <Input id="studentCount" name="studentCount" placeholder="VD: 1500" />
          </div>
        </div>
        <div>
          <Label htmlFor="modules" required>
            Mô-đun quan tâm
          </Label>
          <Select id="modules" name="modules" required defaultValue="">
            <option value="" disabled>
              Chọn mô-đun
            </option>
            {moduleOptions.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="message">Vấn đề bạn đang gặp phải</Label>
          <Textarea
            id="message"
            name="message"
            placeholder="Chia sẻ ngắn gọn thách thức mà nhà trường đang đối mặt..."
          />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Gửi yêu cầu demo
        </Button>
        <p className="text-center text-xs text-[var(--color-ink-400)]">
          Bằng việc gửi biểu mẫu này, bạn đồng ý cho LiênKếtHọc liên hệ để
          sắp xếp lịch demo.
        </p>
      </form>
    </Card>
  );
}