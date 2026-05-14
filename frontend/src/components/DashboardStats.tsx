"use client";

import React from "react";
import clsx from "clsx";
import type { DashboardSummary } from "@/lib/types";

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  colorClass?: string;
  bgClass?: string;
  icon: React.ReactNode;
  trend?: {
    label: string;
    positive?: boolean;
  };
}

function StatCard({
  title,
  value,
  subtitle,
  colorClass = "text-blue-600",
  bgClass = "bg-blue-50",
  icon,
  trend,
}: StatCardProps) {
  return (
    <div className="card p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className={clsx("text-3xl font-bold mt-1 tabular-nums", colorClass)}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend && (
            <span
              className={clsx(
                "inline-flex items-center gap-1 text-xs font-medium mt-2",
                trend.positive ? "text-green-600" : "text-slate-500"
              )}
            >
              {trend.label}
            </span>
          )}
        </div>
        <div
          className={clsx(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ml-4",
            bgClass,
            colorClass
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const TotalLeadsIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const FireIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
  </svg>
);

const SunIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ─── Dashboard Stats Component ────────────────────────────────────────────────

interface DashboardStatsProps {
  summary: DashboardSummary;
}

export function DashboardStats({ summary }: DashboardStatsProps) {
  const avgScore =
    typeof summary.average_score === "number"
      ? summary.average_score.toFixed(1)
      : "0.0";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <StatCard
        title="Total Leads"
        value={summary.total_leads}
        subtitle="All time"
        colorClass="text-slate-700"
        bgClass="bg-slate-100"
        icon={<TotalLeadsIcon />}
      />
      <StatCard
        title="Hot Leads"
        value={summary.hot_leads}
        subtitle="Ready to convert"
        colorClass="text-red-600"
        bgClass="bg-red-50"
        icon={<FireIcon />}
        trend={{ label: "High priority", positive: true }}
      />
      <StatCard
        title="Warm Leads"
        value={summary.warm_leads}
        subtitle="Needs nurturing"
        colorClass="text-amber-600"
        bgClass="bg-amber-50"
        icon={<SunIcon />}
      />
      <StatCard
        title="Avg Score"
        value={avgScore}
        subtitle="Out of 100"
        colorClass="text-blue-600"
        bgClass="bg-blue-50"
        icon={<ChartIcon />}
      />
      <StatCard
        title="Conversion Ready"
        value={summary.conversion_ready}
        subtitle="Emails approved"
        colorClass="text-green-600"
        bgClass="bg-green-50"
        icon={<CheckCircleIcon />}
      />
    </div>
  );
}

export default DashboardStats;
