"use client";

import React from "react";
import type { QualificationStatus } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FilterState {
  status: QualificationStatus | "all";
  search: string;
  sort_by: string;
  sort_order: "asc" | "desc";
}

interface FiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  resultCount?: number;
}

// ─── Sort options ─────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest first" },
  { value: "created_at:asc", label: "Oldest first" },
  { value: "score:desc", label: "Highest score" },
  { value: "score:asc", label: "Lowest score" },
  { value: "first_name:asc", label: "Name A-Z" },
  { value: "first_name:desc", label: "Name Z-A" },
];

const STATUS_OPTIONS: { value: QualificationStatus | "all"; label: string; color: string }[] = [
  { value: "all", label: "All Statuses", color: "" },
  { value: "hot", label: "Hot", color: "text-red-600" },
  { value: "warm", label: "Warm", color: "text-amber-600" },
  { value: "cold", label: "Cold", color: "text-blue-600" },
  { value: "unqualified", label: "Unqualified", color: "text-slate-500" },
];

// ─── Filters Component ────────────────────────────────────────────────────────

export function Filters({ filters, onChange, resultCount }: FiltersProps) {
  const handleStatusChange = (value: string) => {
    onChange({ ...filters, status: value as QualificationStatus | "all" });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filters, search: e.target.value });
  };

  const handleSortChange = (value: string) => {
    const [sort_by, sort_order] = value.split(":") as [string, "asc" | "desc"];
    onChange({ ...filters, sort_by, sort_order });
  };

  const currentSort = `${filters.sort_by}:${filters.sort_order}`;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      {/* Left: Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-4 w-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search name, company, email..."
            value={filters.search}
            onChange={handleSearchChange}
            className="input pl-9 pr-4"
          />
        </div>

        {resultCount !== undefined && (
          <span className="text-sm text-slate-500 whitespace-nowrap">
            {resultCount} result{resultCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Right: Status filter + Sort */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Status filter */}
        <select
          value={filters.status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="input py-2 pr-8 cursor-pointer min-w-[140px]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="input py-2 pr-8 cursor-pointer min-w-[150px]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default Filters;
