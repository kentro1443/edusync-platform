import Link from "next/link";

import {
  createResourceVersionAction,
  addToCollectionAction,
  rollbackResourceVersionAction,
  resourceBookmarkAction,
  resourceCommentAction,
  resourceReportAction,
  transitionResourceAction,
} from "@/app/(app)/dashboard/resources/actions";
import { PageHeader } from "@/components/app/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { requireSchoolContext } from "@/lib/auth/guards";
import { permissions } from "@/lib/auth/permissions";
import { getResource, listResourceCollections, recordResourceEvent } from "@/lib/resources/resource-service";

const statusLabels = {
  DRAFT: "Bản nháp",
  PENDING_REVIEW: "Chờ duyệt",
  PUBLISHED: "Đã xuất bản",
  REJECTED: "Cần chỉnh sửa",
  ARCHIVED: "Đã lưu trữ",
} as const;

export default async function ResourceDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ resourceId: string }>;
  searchParams: Promise<{ result?: string; error?: string }>;
}) {
  const [{ resourceId }, query] = await Promise.all([params, searchParams]);
  const { actor } = await requireSchoolContext(permissions.resourceRead);
  const [resource, collections] = await Promise.all([
    getResource(actor, resourceId),
    listResourceCollections(actor),
  ]);
  await recordResourceEvent(actor, resourceId, "VIEW");
  const canEdit = resource.createdBy.id === actor.userId || actor.schoolRoles.some((role) => ["SCHOOL_ADMIN", "TEACHER_STAFF", "APPROVER_REVIEWER"].includes(role));
  const canModerate = actor.schoolRoles.some((role) => ["SCHOOL_ADMIN", "TEACHER_STAFF", "APPROVER_REVIEWER"].includes(role));
  const status = resource.status as keyof typeof statusLabels;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Chi tiết tài nguyên"
        title={resource.title}
        description={resource.summary ?? "Tài nguyên chưa có mô tả."}
        actions={<LinkButton href="/dashboard/resources" variant="outline" size="sm">Về thư viện</LinkButton>}
      />
      {query.result ? <Alert tone="success" title="Đã cập nhật">Thao tác đã được ghi nhận và audit theo tenant.</Alert> : null}
      {query.error ? <Alert tone="danger" title="Không thể hoàn tất thao tác">Bạn không có quyền hoặc dữ liệu chưa hợp lệ.</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-ink-100)] pb-4">
              <div className="flex flex-wrap items-center gap-2"><Badge tone={status === "PUBLISHED" ? "success" : status === "PENDING_REVIEW" ? "warning" : status === "REJECTED" ? "danger" : "neutral"}>{statusLabels[status]}</Badge><span className="text-sm text-[var(--color-ink-500)]">Hiển thị: {resource.visibility === "PRIVATE" ? "Riêng tư" : resource.visibility === "PUBLIC" ? "Công khai" : "Trong trường"}</span></div>
              <form action={resourceBookmarkAction}><input type="hidden" name="resourceId" value={resource.id} /><Button type="submit" variant="outline" size="sm">Lưu tài nguyên</Button></form>
            </div>
            <article className="prose prose-slate mt-6 max-w-none whitespace-pre-wrap text-sm leading-7 text-[var(--color-ink-700)]">{resource.currentVersion?.body || "Tài nguyên chưa có nội dung văn bản."}</article>
            {resource.currentVersion ? (
              <div className="mt-6 flex flex-wrap gap-3 border-t border-[var(--color-ink-100)] pt-4">
                <span className="text-xs text-[var(--color-ink-500)]">Phiên bản {resource.currentVersion.versionNumber}</span>
                <Link href={`/dashboard/resources/${resource.id}/download?versionId=${resource.currentVersion.id}`} className="text-xs font-semibold text-[var(--color-brand-700)] hover:underline">Tải file hiện tại</Link>
              </div>
            ) : null}
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Bình luận</h2>
            {resource.comments.length === 0 ? <EmptyState title="Chưa có bình luận" description="Đặt câu hỏi hoặc chia sẻ gợi ý cho tác giả." /> : <div className="mt-4 space-y-4">{resource.comments.map((comment) => <div key={comment.id} className="rounded-[var(--radius-md)] bg-[var(--color-ink-50)] p-4"><p className="text-xs font-semibold text-[var(--color-ink-600)]">{comment.author.displayName}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--color-ink-700)]">{comment.body}</p></div>)}</div>}
            <form action={resourceCommentAction} className="mt-5 grid gap-3 border-t border-[var(--color-ink-100)] pt-5"><input type="hidden" name="resourceId" value={resource.id} /><Field id="comment-body" label="Bình luận mới" required><Textarea id="comment-body" name="body" minLength={2} maxLength={2000} required /></Field><Button type="submit" size="sm">Gửi bình luận</Button></form>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <h2 className="text-lg font-bold text-[var(--color-ink-900)]">Quy trình</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-ink-500)]">Bản nháp cần gửi duyệt. Phiên bản đã xuất bản không bị sửa trực tiếp; rollback luôn tạo phiên bản mới.</p>
            {canEdit || canModerate ? (
              <div className="mt-5 space-y-2">
                {status === "DRAFT" || status === "REJECTED" ? <form action={transitionResourceAction}><input type="hidden" name="resourceId" value={resource.id} /><input type="hidden" name="action" value="SUBMIT_REVIEW" /><Button type="submit" size="sm" className="w-full">Gửi duyệt</Button></form> : null}
                {status === "PENDING_REVIEW" && canModerate ? <><form action={transitionResourceAction}><input type="hidden" name="resourceId" value={resource.id} /><input type="hidden" name="action" value="APPROVE" /><Button type="submit" size="sm" className="w-full">Duyệt và xuất bản</Button></form><form action={transitionResourceAction}><input type="hidden" name="resourceId" value={resource.id} /><input type="hidden" name="action" value="REJECT" /><Button type="submit" variant="outline" size="sm" className="w-full">Yêu cầu chỉnh sửa</Button></form></> : null}
                {status === "PUBLISHED" && canEdit ? <form action={transitionResourceAction}><input type="hidden" name="resourceId" value={resource.id} /><input type="hidden" name="action" value="ARCHIVE" /><Button type="submit" variant="outline" size="sm" className="w-full">Lưu trữ</Button></form> : null}
                {status === "ARCHIVED" && canEdit ? <form action={transitionResourceAction}><input type="hidden" name="resourceId" value={resource.id} /><input type="hidden" name="action" value="RESTORE" /><Button type="submit" variant="outline" size="sm" className="w-full">Khôi phục bản nháp</Button></form> : null}
              </div>
            ) : null}
          </Card>
          {canEdit ? <Card><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Tạo phiên bản mới</h2><form action={createResourceVersionAction} encType="multipart/form-data" className="mt-4 grid gap-4"><input type="hidden" name="resourceId" value={resource.id} /><Field id="version-title" label="Tiêu đề phiên bản" required><Input id="version-title" name="title" defaultValue={resource.currentVersion?.title ?? resource.title} required /></Field><Field id="version-summary" label="Mô tả"><Textarea id="version-summary" name="summary" defaultValue={resource.currentVersion?.summary ?? ""} /></Field><Field id="version-body" label="Nội dung"><Textarea id="version-body" name="body" rows={8} defaultValue={resource.currentVersion?.body ?? ""} /></Field><Field id="file" label="File đính kèm"><Input id="file" name="file" type="file" accept=".pdf,.txt,.md,.jpg,.jpeg,.png,.webp,.docx,.pptx,.xlsx" /></Field><Button type="submit" size="sm">Lưu phiên bản mới</Button><p className="text-xs leading-5 text-[var(--color-ink-500)]">PDF, ảnh, Office; tối đa 25 MB. Phiên bản cũ không bị ghi đè.</p></form></Card> : null}
          <Card><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Lịch sử phiên bản</h2><ol className="mt-4 space-y-3">{resource.versions.map((version) => <li key={version.id} className="rounded-[var(--radius-md)] border border-[var(--color-ink-100)] p-3"><p className="text-sm font-semibold text-[var(--color-ink-800)]">Phiên bản {version.versionNumber}{resource.currentVersionId === version.id ? " · hiện tại" : ""}</p><p className="mt-1 text-xs text-[var(--color-ink-500)]">{version.createdBy.displayName}</p><div className="mt-2 flex flex-wrap gap-3"><Link href={`/dashboard/resources/${resource.id}/download?versionId=${version.id}`} className="text-xs font-semibold text-[var(--color-brand-700)] hover:underline">Tải phiên bản</Link>{canEdit && resource.currentVersionId !== version.id ? <form action={rollbackResourceVersionAction}><input type="hidden" name="resourceId" value={resource.id} /><input type="hidden" name="versionId" value={version.id} /><button type="submit" className="text-xs font-semibold text-[var(--color-brand-700)] hover:underline">Khôi phục thành phiên bản mới</button></form> : null}</div></li>)}</ol></Card>
          <Card><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Báo cáo nội dung</h2><form action={resourceReportAction} className="mt-4 grid gap-3"><input type="hidden" name="resourceId" value={resource.id} /><Field id="report-reason" label="Lý do" required><Textarea id="report-reason" name="reason" minLength={5} maxLength={1000} required /></Field><Button type="submit" variant="outline" size="sm">Gửi báo cáo</Button></form></Card>
          {collections.length > 0 ? <Card><h2 className="text-lg font-bold text-[var(--color-ink-900)]">Thêm vào bộ sưu tập</h2><form action={addToCollectionAction} className="mt-4 grid gap-3"><input type="hidden" name="resourceId" value={resource.id} /><Field id="collectionId" label="Bộ sưu tập" required><select id="collectionId" name="collectionId" className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-ink-300)] bg-white px-3 text-sm" required>{collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}</select></Field><Button type="submit" variant="outline" size="sm">Thêm tài nguyên</Button></form></Card> : null}
        </aside>
      </div>
    </div>
  );
}
