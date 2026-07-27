import { z } from "zod";

const optionalText = (max: number) =>
  z.preprocess(
    (value) => {
      const normalized = String(value ?? "").trim();
      return normalized || undefined;
    },
    z.string().max(max, `Không được vượt quá ${max} ký tự.`).optional(),
  );

const requiredText = (
  min: number,
  max: number,
  requiredMessage: string,
) =>
  z.preprocess(
    (value) => String(value ?? ""),
    z
      .string()
      .trim()
      .min(min, requiredMessage)
      .max(max, `Không được vượt quá ${max} ký tự.`),
  );

const demoRequestSchema = z.object({
  fullName: requiredText(2, 120, "Vui lòng nhập đầy đủ họ tên."),
  role: z.enum(["principal", "it", "teacher", "other"], {
    error: "Vui lòng chọn vai trò.",
  }),
  schoolName: requiredText(2, 180, "Vui lòng nhập tên trường."),
  email: z.preprocess(
    (value) => String(value ?? "").trim().toLowerCase(),
    z
      .string()
      .email("Email công vụ chưa đúng định dạng.")
      .max(254, "Email không được vượt quá 254 ký tự."),
  ),
  phone: optionalText(30),
  studentCount: z.preprocess(
    (value) => {
      const normalized = String(value ?? "").trim();
      return normalized ? Number(normalized) : undefined;
    },
    z
      .number({ error: "Quy mô học sinh phải là số." })
      .int("Quy mô học sinh phải là số nguyên.")
      .min(1, "Quy mô học sinh phải lớn hơn 0.")
      .max(100_000, "Quy mô học sinh chưa hợp lệ.")
      .optional(),
  ),
  module: z.enum(
    ["mentoring", "resources", "appointments", "workflows", "clubs-events", "all"],
    { error: "Vui lòng chọn mô-đun quan tâm." },
  ),
  message: optionalText(2_000),
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;

export type DemoRequestParseResult =
  | { ok: true; data: DemoRequestInput }
  | { ok: false; fieldErrors: Record<string, string> }
  | { ok: false; bot: true };

export function parseDemoRequest(formData: FormData): DemoRequestParseResult {
  if (String(formData.get("website") ?? "").trim()) {
    return { ok: false, bot: true };
  }

  const result = demoRequestSchema.safeParse({
    fullName: formData.get("fullName"),
    role: formData.get("role"),
    schoolName: formData.get("school"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    studentCount: formData.get("studentCount"),
    module: formData.get("modules"),
    message: formData.get("message"),
  });

  if (result.success) {
    return { ok: true, data: result.data };
  }

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const rawField = String(issue.path[0] ?? "form");
    const field = rawField === "module" ? "modules" : rawField;
    fieldErrors[field] ??= issue.message;
  }
  return { ok: false, fieldErrors };
}
