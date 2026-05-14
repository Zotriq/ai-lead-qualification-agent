"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import clsx from "clsx";
import type { Lead, QualificationStatus } from "@/lib/types";

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<QualificationStatus, string> = {
  hot: "bg-red-100 text-red-700 ring-1 ring-red-200",
  warm: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  cold: "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  unqualified: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
};

const STATUS_DOTS: Record<QualificationStatus, string> = {
  hot: "bg-red-500",
  warm: "bg-amber-500",
  cold: "bg-blue-500",
  unqualified: "bg-slate-400",
};

export function StatusBadge({ status }: { status: QualificationStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
        STATUS_STYLES[status]
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", STATUS_DOTS[status])} />
      {status}
    </span>
  );
}

// ─── Score Badge ──────────────────────────────────────────────────────────────

export function ScoreBadge({ score }: { score: number }) {
  const style =
    score >= 75
      ? "bg-green-100 text-green-700 ring-1 ring-green-200"
      : score >= 50
      ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
      : score >= 25
      ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200"
      : "bg-slate-100 text-slate-600 ring-1 ring-slate-200";

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center w-12 h-7 rounded-md text-xs font-bold tabular-nums",
        style
      )}
    >
      {score}
    </span>
  );
}

// ─── Source Label ─────────────────────────────────────────────────────────────

export function SourceLabel({ source }: { source: string | null }) {
  if (!source) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
      {source}
    </span>
  );
}

// ─── Lead Table ───────────────────────────────────────────────────────────────

interface LeadTableProps {
  leads: Lead[];
  loading?: boolean;
}

export function LeadTable({ leads, loading }: LeadTableProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="card overflow-hidden">
        <div className="animate-pulse">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-slate-100">
              <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 rounded w-1/4" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
              <div className="w-16 h-6 bg-slate-200 rounded" />
              <div className="w-20 h-6 bg-slate-200 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg
            className="w-12 h-12 text-slate-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <p className="text-slate-500 font-medium">No leads found</p>
          <p className="text-slate-400 text-sm mt-1">
            Try adjusting your filters or search query
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Company
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Email
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Score
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Source
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Date
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="table-row cursor-pointer"
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                {/* Name */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">
                        {lead.first_name[0]}
                        {lead.last_name[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {lead.first_name} {lead.last_name}
                      </p>
                      {lead.job_title && (
                        <p className="text-xs text-slate-400">{lead.job_title}</p>
                      )}
                    </div>
                  </div>
                </td>

                {/* Company */}
                <td className="px-4 py-4">
                  <span className="text-sm text-slate-700">
                    {lead.company || <span className="text-slate-400">—</span>}
                  </span>
                </td>

                {/* Email */}
                <td className="px-4 py-4">
                  <span className="text-sm text-slate-600">{lead.email}</span>
                </td>

                {/* Score */}
                <td className="px-4 py-4 text-center">
                  <ScoreBadge score={lead.score} />
                </td>

                {/* Status */}
                <td className="px-4 py-4">
                  <StatusBadge status={lead.qualification_status} />
                </td>

                {/* Source */}
                <td className="px-4 py-4">
                  <SourceLabel source={lead.source} />
                </td>

                {/* Date */}
                <td className="px-4 py-4">
                  <span className="text-xs text-slate-400">
                    {format(new Date(lead.created_at), "MMM d, yyyy")}
                  </span>
                </td>

                {/* Arrow */}
                <td className="px-3 py-4">
                  <svg
                    className="w-4 h-4 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LeadTable;
