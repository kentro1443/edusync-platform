"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/cn";

function describeAccept(accept?: string) {
  if (!accept) return "tệp được phép";
  return accept
    .split(",")
    .map((type) => type.trim().replace("application/pdf", "PDF").replace("image/*", "hình ảnh"))
    .join(", ");
}

export function FileUpload({
  name,
  accept,
  maxSizeMb,
  multiple = false,
  disabled = false,
  className,
}: {
  name: string;
  accept?: string;
  maxSizeMb: number;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const generatedId = useId();
  const [selection, setSelection] = useState<string>("");
  const inputId = `${name}-${generatedId}`;

  return (
    <div className={cn("rounded-[var(--radius-lg)] border border-dashed border-[var(--color-ink-300)] bg-[var(--color-ink-50)] p-5 text-center", className)}>
      <label htmlFor={inputId} className="block cursor-pointer">
        <span className="block text-sm font-semibold text-[var(--color-ink-800)]">Chọn tệp từ thiết bị</span>
        <span className="mt-1 block text-xs text-[var(--color-ink-500)]">
          Hỗ trợ {describeAccept(accept)}, tối đa {maxSizeMb} MB{multiple ? " mỗi tệp" : ""}.
        </span>
      </label>
      <input
        id={inputId}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        aria-describedby={`${inputId}-status`}
        onChange={(event) => {
          const files = Array.from(event.currentTarget.files ?? []);
          setSelection(files.length ? files.map((file) => file.name).join(", ") : "");
        }}
      />
      <p id={`${inputId}-status`} role="status" className="mt-3 min-h-5 text-xs font-medium text-[var(--color-brand-700)]">
        {selection || "Chưa chọn tệp"}
      </p>
    </div>
  );
}
