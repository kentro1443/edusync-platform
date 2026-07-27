"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { switchDevAccountAction } from "@/app/dev/switch/actions";
import { translateRole } from "@/components/app/shell-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { BuildingIcon, SearchIcon } from "@/components/ui/icons";
import type { DevSwitchSchoolOption } from "@/lib/auth/dev-switching";

function getInitials(displayName: string): string {
  return (
    displayName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((part) => part[0])
      .join("")
      .toLocaleUpperCase("vi") || "ES"
  );
}

function SwitchButton({ displayName }: { displayName: string }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      loading={pending}
      loadingLabel="Đang chuyển…"
      aria-label={`Dùng tài khoản ${displayName}`}
      className="min-h-11 w-full sm:w-auto"
    >
      Dùng tài khoản
    </Button>
  );
}

export function DevAccountPicker({
  schools,
  initialSchoolId,
}: {
  schools: readonly DevSwitchSchoolOption[];
  initialSchoolId: string;
}) {
  const [selectedSchoolId, setSelectedSchoolId] = useState(initialSchoolId);
  const [query, setQuery] = useState("");
  const selectedSchool =
    schools.find(({ id }) => id === selectedSchoolId) ?? schools[0];
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const accounts = (() => {
    if (!selectedSchool) return [];
    if (!normalizedQuery) return selectedSchool.accounts;

    return selectedSchool.accounts.filter((account) => {
      const searchable = [
        account.displayName,
        account.email,
        ...account.roles.map(translateRole),
      ]
        .join(" ")
        .toLocaleLowerCase("vi");
      return searchable.includes(normalizedQuery);
    });
  })();

  if (!selectedSchool) {
    return (
      <div
        role="status"
        className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-ink-300)] bg-[var(--color-surface)] px-6 py-12 text-center"
      >
        <h2 className="text-lg font-semibold text-[var(--color-ink-900)]">
          Chưa có tài khoản demo
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-500)]">
          Chạy lại dữ liệu mẫu để tạo trường và tài khoản dùng thử.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-labelledby="account-picker-title"
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-ink-200)] bg-[var(--color-surface)] shadow-[var(--shadow-md)]"
    >
      <div className="border-b border-[var(--color-ink-200)] px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--color-brand-700)]">
              Không gian kiểm thử
            </p>
            <h2
              id="account-picker-title"
              className="mt-1 text-xl font-bold text-[var(--color-ink-900)]"
            >
              Chọn vai trò muốn trải nghiệm
            </h2>
          </div>
          <label className="relative block w-full lg:max-w-sm">
            <span className="sr-only">Tìm tài khoản theo tên, email hoặc vai trò</span>
            <SearchIcon
              aria-hidden="true"
              width={18}
              height={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-400)]"
            />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm tên, email hoặc vai trò…"
              className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-ink-300)] bg-[var(--color-ink-50)] pl-10 pr-4 text-sm text-[var(--color-ink-900)] placeholder:text-[var(--color-ink-400)]"
            />
          </label>
        </div>

        <label className="mt-4 block lg:hidden">
          <span className="mb-1.5 block text-sm font-semibold text-[var(--color-ink-700)]">
            Trường đang chọn
          </span>
          <select
            value={selectedSchool.id}
            onChange={(event) => {
              setSelectedSchoolId(event.target.value);
              setQuery("");
            }}
            className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-ink-300)] bg-white px-3 text-sm text-[var(--color-ink-900)]"
          >
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name} · {school.accounts.length} tài khoản
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
        <nav
          aria-label="Chọn trường demo"
          className="hidden border-r border-[var(--color-ink-200)] bg-[var(--color-ink-50)] p-3 lg:block"
        >
          {schools.map((school) => {
            const selected = school.id === selectedSchool.id;
            return (
              <button
                key={school.id}
                type="button"
                onClick={() => {
                  setSelectedSchoolId(school.id);
                  setQuery("");
                }}
                aria-current={selected ? "true" : undefined}
                className={`mb-1 flex min-h-14 w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-left transition-colors ${
                  selected
                    ? "bg-[var(--color-brand-100)] text-[var(--color-brand-900)]"
                    : "text-[var(--color-ink-700)] hover:bg-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                    selected
                      ? "bg-[var(--color-brand-700)] text-white"
                      : "bg-white text-[var(--color-ink-500)]"
                  }`}
                >
                  <BuildingIcon width={18} height={18} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {school.shortName}
                  </span>
                  <span className="block text-xs opacity-70">
                    {school.accounts.length} tài khoản
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <div className="min-w-0 p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[var(--color-ink-900)]">
                {selectedSchool.name}
              </p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-500)]">
                Quyền và dữ liệu sẽ được giới hạn theo trường này.
              </p>
            </div>
            <span className="text-xs font-medium text-[var(--color-ink-500)]">
              {accounts.length}/{selectedSchool.accounts.length} tài khoản
            </span>
          </div>

          {accounts.length ? (
            <ul className="space-y-3" aria-live="polite">
              {accounts.map((account) => (
                <li key={account.id}>
                  <form
                    action={switchDevAccountAction}
                    className="flex flex-col gap-4 rounded-[var(--radius-md)] border border-[var(--color-ink-200)] p-4 transition-[border-color,box-shadow] duration-150 hover:border-[var(--color-brand-300)] hover:shadow-[var(--shadow-sm)] sm:flex-row sm:items-center"
                  >
                    <input type="hidden" name="schoolId" value={selectedSchool.id} />
                    <input type="hidden" name="targetUserId" value={account.id} />
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-100)] text-sm font-bold text-[var(--color-brand-800)]">
                      {getInitials(account.displayName)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[var(--color-ink-900)]">
                        {account.displayName}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-[var(--color-ink-500)]">
                        {account.email}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-1.5">
                        {account.roles.map((role) => (
                          <Badge key={role} tone="neutral" className="px-2.5 py-1">
                            {translateRole(role)}
                          </Badge>
                        ))}
                      </span>
                    </span>
                    <SwitchButton displayName={account.displayName} />
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <div
              role="status"
              className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-ink-300)] px-5 py-10 text-center"
            >
              <p className="font-semibold text-[var(--color-ink-800)]">
                Không tìm thấy tài khoản phù hợp
              </p>
              <p className="mt-1 text-sm text-[var(--color-ink-500)]">
                Thử tên, email hoặc vai trò khác.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
