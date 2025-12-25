"use client";

import React from "react";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  emptyText?: string;
};

export function DataTable<T>({ columns, data, emptyText = "目前沒有資料" }: Props<T>) {
  if (!data.length) {
    return <div className="rounded-2xl border bg-white p-4 text-sm text-slate-500">{emptyText}</div>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="px-4 py-3 font-semibold text-slate-700">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} className="border-t">
              {columns.map((c) => (
                <td key={String(c.key)} className={`px-4 py-3 align-top ${c.className ?? ""}`}>
                  {c.render ? c.render(row) : String((row as any)[c.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
