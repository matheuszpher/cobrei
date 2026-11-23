import { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  empty?: ReactNode;
  renderExpanded?: (row: T) => ReactNode;
  isExpanded?: (row: T) => boolean;
}

const alignCls = { left: 'text-left', right: 'text-right', center: 'text-center' };

export function Table<T>({ columns, rows, rowKey, onRowClick, loading, empty, renderExpanded, isExpanded }: Props<T>) {
  return (
    <div className="overflow-hidden rounded-3xl border border-borda bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-borda-fina">
              {columns.map((c) => (
                <th key={c.key} className={`whitespace-nowrap px-5 pb-3 pt-5 text-[11px] font-medium uppercase tracking-[0.12em] text-oliva ${alignCls[c.align ?? 'left']} ${c.className ?? ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-borda-fina">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} className="px-5 py-5">
                        <div className="h-3.5 w-full max-w-[140px] animate-pulse rounded-full bg-creme-escuro" />
                      </td>
                    ))}
                  </tr>
                ))
              : rows.map((r) => (
                  <RowGroup key={rowKey(r)} row={r} columns={columns} onRowClick={onRowClick} expanded={isExpanded?.(r) ?? false} renderExpanded={renderExpanded} />
                ))}
          </tbody>
        </table>
      </div>
      {!loading && rows.length === 0 && <div className="border-t border-borda-fina">{empty}</div>}
    </div>
  );
}

function RowGroup<T>({
  row,
  columns,
  onRowClick,
  expanded,
  renderExpanded,
}: {
  row: T;
  columns: Column<T>[];
  onRowClick?: (r: T) => void;
  expanded: boolean;
  renderExpanded?: (r: T) => ReactNode;
}) {
  return (
    <>
      <tr
        onClick={onRowClick ? () => onRowClick(row) : undefined}
        className={`transition-colors hover:bg-creme-claro ${onRowClick ? 'cursor-pointer' : ''} ${expanded ? 'bg-creme-claro' : ''}`}
      >
        {columns.map((c) => (
          <td key={c.key} className={`px-5 py-4 text-sm text-slate-700 ${alignCls[c.align ?? 'left']} ${c.className ?? ''}`}>
            {c.render(row)}
          </td>
        ))}
      </tr>
      {expanded && renderExpanded && (
        <tr className="bg-creme-claro">
          <td colSpan={columns.length} className="px-6 pb-6 pt-1">
            {renderExpanded(row)}
          </td>
        </tr>
      )}
    </>
  );
}
