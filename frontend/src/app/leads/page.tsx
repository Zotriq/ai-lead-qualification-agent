"use client";

import React, { Suspense, useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchLeads } from "@/lib/api";
import type { Lead, QualificationStatus } from "@/lib/types";
import { LeadTable } from "@/components/LeadTable";
import { Filters, type FilterState } from "@/components/Filters";

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

function Pagination({ page, pages, total, pageSize, onChange }: PaginationProps) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (pages <= 1) return null;

  const pageNumbers = (): (number | "...")[] => {
    if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
    const result: (number | "...")[] = [1];
    if (page > 3) result.push("...");
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) {
      result.push(i);
    }
    if (page < pages - 2) result.push("...");
    result.push(pages);
    return result;
  };

  return (
    <div className="flex items-center justify-between mt-4">
      <p className="text-sm text-slate-500">
        Showing {start}–{end} of {total} leads
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page === 1}
          className="btn-ghost py-1.5 px-2 text-sm disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {pageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-sm">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={
                p === page
                  ? "w-8 h-8 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                  : "w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-600 text-sm"
              }
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onChange(page + 1)}
          disabled={page === pages}
          className="btn-ghost py-1.5 px-2 text-sm disabled:opacity-40"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Leads Page Inner (uses useSearchParams) ─────────────────────────────────

const PAGE_SIZE = 20;

function LeadsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(() => {
    const p = searchParams.get("page");
    return p ? parseInt(p, 10) : 1;
  });

  const [filters, setFilters] = useState<FilterState>({
    status: (searchParams.get("status") as QualificationStatus | "all") || "all",
    search: searchParams.get("search") || "",
    sort_by: searchParams.get("sort_by") || "created_at",
    sort_order: (searchParams.get("sort_order") as "asc" | "desc") || "desc",
  });

  // Debounce search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const loadLeads = useCallback(
    async (currentPage: number, currentFilters: FilterState) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchLeads({
          page: currentPage,
          page_size: PAGE_SIZE,
          status: currentFilters.status,
          search: currentFilters.search || undefined,
          sort_by: currentFilters.sort_by,
          sort_order: currentFilters.sort_order,
        });
        setLeads(result.items);
        setTotal(result.total);
        setPages(result.pages);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leads");
        setLeads([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Trigger on page or filter change
  useEffect(() => {
    loadLeads(page, filters);
  }, [page, filters, loadLeads]);

  // Debounce filter changes
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
    }, 300);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-slate-500 text-sm mt-1">
            {total > 0
              ? `${total} lead${total !== 1 ? "s" : ""} in your pipeline`
              : "Manage and review all your leads"}
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="btn-secondary text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Dashboard
        </button>
      </div>

      {/* Filters */}
      <Filters
        filters={filters}
        onChange={handleFiltersChange}
        resultCount={!loading ? total : undefined}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
          <button
            onClick={() => loadLeads(page, filters)}
            className="ml-auto text-xs underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <LeadTable leads={leads} loading={loading} />

      {/* Pagination */}
      {!loading && !error && (
        <Pagination
          page={page}
          pages={pages}
          total={total}
          pageSize={PAGE_SIZE}
          onChange={handlePageChange}
        />
      )}
    </div>
  );
}

// ─── Exported Page (with Suspense boundary) ──────────────────────────────────

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      }
    >
      <LeadsPageInner />
    </Suspense>
  );
}
