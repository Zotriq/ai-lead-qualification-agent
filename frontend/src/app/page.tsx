"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import clsx from "clsx";
import { format } from "date-fns";
import {
  fetchDashboardSummary,
  fetchLeadsByStatus,
  fetchLeadsBySource,
  fetchLeads,
} from "@/lib/api";
import type {
  DashboardSummary,
  LeadsByStatus,
  LeadsBySource,
  Lead,
  QualificationStatus,
} from "@/lib/types";
import { DashboardStats } from "@/components/DashboardStats";
import { StatusBadge, ScoreBadge } from "@/components/LeadTable";

// ─── Status bar colors ────────────────────────────────────────────────────────

const STATUS_COLORS: Record<QualificationStatus, string> = {
  hot: "bg-red-500",
  warm: "bg-amber-500",
  cold: "bg-blue-500",
  unqualified: "bg-slate-400",
};

const STATUS_TEXT: Record<QualificationStatus, string> = {
  hot: "text-red-600",
  warm: "text-amber-600",
  cold: "text-blue-600",
  unqualified: "text-slate-500",
};

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [byStatus, setByStatus] = useState<LeadsByStatus[]>([]);
  const [bySource, setBySource] = useState<LeadsBySource[]>([]);
  const [hotLeads, setHotLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [summaryData, statusData, sourceData, hotData] = await Promise.all([
        fetchDashboardSummary(),
        fetchLeadsByStatus(),
        fetchLeadsBySource(),
        fetchLeads({ status: "hot", page_size: 5, sort_by: "score", sort_order: "desc" }),
      ]);
      setSummary(summaryData);
      setByStatus(statusData);
      setBySource(sourceData);
      setHotLeads(hotData.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalStatusCount = byStatus.reduce((sum, s) => sum + s.count, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-slate-200 rounded w-48 animate-pulse" />
            <div className="h-4 bg-slate-100 rounded w-64 mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-8 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-slate-800 font-semibold">Failed to load dashboard</p>
        <p className="text-slate-500 text-sm mt-1 max-w-sm">{error}</p>
        <button onClick={() => loadData()} className="btn-primary mt-4">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Overview of your AI lead qualification pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            {format(new Date(), "MMM d, yyyy")}
          </span>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="btn-secondary text-sm"
          >
            <svg
              className={clsx("w-4 h-4", refreshing && "animate-spin")}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
          <Link href="/leads" className="btn-primary text-sm">
            View All Leads
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      {summary && <DashboardStats summary={summary} />}

      {/* Middle row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leads by status */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title text-base">Leads by Status</h2>
          </div>
          <div className="card-body space-y-3">
            {byStatus.length === 0 ? (
              <p className="text-sm text-slate-500">No data available</p>
            ) : (
              byStatus.map((item) => {
                const pct = totalStatusCount > 0
                  ? Math.round((item.count / totalStatusCount) * 100)
                  : 0;
                return (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={item.status} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={clsx("text-sm font-bold tabular-nums", STATUS_TEXT[item.status])}>
                          {item.count}
                        </span>
                        <span className="text-xs text-slate-400">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className={clsx("h-2 rounded-full transition-all duration-500", STATUS_COLORS[item.status])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Leads by source */}
        <div className="card">
          <div className="card-header">
            <h2 className="section-title text-base">Leads by Source</h2>
          </div>
          <div className="card-body">
            {bySource.length === 0 ? (
              <p className="text-sm text-slate-500">No data available</p>
            ) : (
              <div className="space-y-2">
                {bySource.map((item, i) => {
                  const maxCount = Math.max(...bySource.map((s) => s.count));
                  const pct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
                  return (
                    <div key={item.source || i} className="flex items-center gap-3">
                      <span className="text-sm text-slate-600 w-28 truncate flex-shrink-0">
                        {item.source || "Unknown"}
                      </span>
                      <div className="flex-1 bg-slate-100 rounded-full h-2">
                        <div
                          className="h-2 bg-blue-400 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700 w-8 text-right tabular-nums">
                        {item.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hot leads */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
            <h2 className="section-title text-base">Hot Leads</h2>
          </div>
          <Link href="/leads?status=hot" className="text-sm text-blue-600 hover:underline">
            View all
          </Link>
        </div>
        {hotLeads.length === 0 ? (
          <div className="card-body">
            <p className="text-sm text-slate-500">No hot leads at the moment.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {hotLeads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-bold">
                    {lead.first_name[0]}{lead.last_name[0]}
                  </span>
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {lead.first_name} {lead.last_name}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {lead.company || lead.email}
                  </p>
                </div>
                {/* Score */}
                <ScoreBadge score={lead.score} />
                {/* Arrow */}
                <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
