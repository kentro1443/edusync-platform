import { cn } from "@/lib/cn";

type TableRow = { id: string; [key: string]: React.ReactNode };

type Column<Row extends TableRow> = {
  key: keyof Row & string;
  header: string;
  primary?: boolean;
  className?: string;
  render?: (row: Row) => React.ReactNode;
};

export function DataTable<Row extends TableRow>({
  caption,
  columns,
  rows,
  rowActions,
  className,
}: {
  caption: string;
  columns: ReadonlyArray<Column<Row>>;
  rows: ReadonlyArray<Row>;
  rowActions?: (row: Row) => React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-surface)]", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="hidden bg-[var(--color-ink-50)] text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-ink-500)] md:table-header-group">
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn("border-b px-5 py-3.5", column.className)}>
                  {column.header}
                </th>
              ))}
              {rowActions ? <th scope="col" className="border-b px-5 py-3.5 text-right"><span className="sr-only">Tác vụ</span></th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-ink-100)]">
            {rows.map((row) => (
              <tr key={row.id} className="grid gap-3 px-4 py-4 transition-colors hover:bg-[var(--color-brand-50)] md:table-row md:px-0 md:py-0">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    data-label={column.header}
                    className={cn(
                      "grid grid-cols-[7rem_1fr] items-start gap-3 text-[var(--color-ink-600)] before:text-xs before:font-semibold before:uppercase before:tracking-wide before:text-[var(--color-ink-400)] before:content-[attr(data-label)] md:table-cell md:px-5 md:py-4 md:before:hidden",
                      column.primary && "font-semibold text-[var(--color-ink-900)]",
                      column.className,
                    )}
                  >
                    <span>{column.render ? column.render(row) : row[column.key]}</span>
                  </td>
                ))}
                {rowActions ? <td className="flex justify-end md:table-cell md:px-5 md:py-4 md:text-right">{rowActions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
