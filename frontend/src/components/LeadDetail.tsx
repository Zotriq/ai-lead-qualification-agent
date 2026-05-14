"use client";

import React from "react";
import clsx from "clsx";
import { format } from "date-fns";
import type { Lead, LeadActivity, IntegrationSync, AIAnalysis, QualificationStatus } from "@/lib/types";
import { StatusBadge, ScoreBadge } from "./LeadTable";

// ─── AI Analysis Section ──────────────────────────────────────────────────────

function AIAnalysisSection({ analysis }: { analysis: AIAnalysis }) {
  const fields: { key: keyof AIAnalysis; label: string; type?: string }[] = [
    { key: "intent", label: "Purchase Intent" },
    { key: "budget_fit", label: "Budget Fit" },
    { key: "urgency", label: "Urgency Level" },
    { key: "recommended_action", label: "Recommended Action" },
    { key: "reasoning", label: "AI Reasoning", type: "long" },
    { key: "pain_points", label: "Pain Points", type: "list" },
    { key: "risks", label: "Potential Risks", type: "list" },
  ];

  const getValueStyle = (key: string, value: string) => {
    const lower = value.toLowerCase();
    if (["high", "strong", "excellent", "yes"].some((v) => lower.includes(v))) {
      return "text-green-700 bg-green-50 border border-green-200";
    }
    if (["medium", "moderate", "partial"].some((v) => lower.includes(v))) {
      return "text-amber-700 bg-amber-50 border border-amber-200";
    }
    if (["low", "weak", "poor", "no"].some((v) => lower.includes(v))) {
      return "text-red-700 bg-red-50 border border-red-200";
    }
    return "text-slate-700 bg-slate-50 border border-slate-200";
  };

  return (
    <div className="card">
      <div className="card-header flex items-center gap-2">
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <h3 className="section-title">AI Analysis</h3>
        {analysis.confidence_score !== undefined && (
          <span className="text-xs text-slate-500 ml-auto">
            Confidence: {Math.round((analysis.confidence_score as number) * 100)}%
          </span>
        )}
      </div>
      <div className="card-body space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {fields
            .filter((f) => f.type !== "long" && f.type !== "list")
            .map(({ key, label }) => {
              const value = analysis[key];
              if (!value) return null;
              return (
                <div key={String(key)}>
                  <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                  <span
                    className={clsx(
                      "inline-block px-2.5 py-1 rounded-md text-xs font-semibold",
                      getValueStyle(String(key), String(value))
                    )}
                  >
                    {String(value)}
                  </span>
                </div>
              );
            })}
        </div>

        {analysis.reasoning && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">AI Reasoning</p>
            <p className="text-sm text-slate-700 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-200 leading-relaxed">
              {analysis.reasoning}
            </p>
          </div>
        )}

        {Array.isArray(analysis.pain_points) && analysis.pain_points.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Pain Points Identified</p>
            <ul className="space-y-1">
              {(analysis.pain_points as string[]).map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">!</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}

        {Array.isArray(analysis.risks) && analysis.risks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">Potential Risks</p>
            <ul className="space-y-1">
              {(analysis.risks as string[]).map((risk, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="w-4 h-4 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">x</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity Timeline ────────────────────────────────────────────────────────

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  lead_created: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  ),
  lead_qualified: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  email_generated: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  email_approved: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  email_sent: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  ),
};

const ACTIVITY_COLORS: Record<string, string> = {
  lead_created: "bg-blue-100 text-blue-600",
  lead_qualified: "bg-green-100 text-green-600",
  email_generated: "bg-purple-100 text-purple-600",
  email_approved: "bg-emerald-100 text-emerald-600",
  email_sent: "bg-blue-100 text-blue-700",
  email_rejected: "bg-red-100 text-red-600",
  integration_synced: "bg-slate-100 text-slate-600",
};

function ActivityTimeline({ activities }: { activities: LeadActivity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="section-title">Activity Timeline</h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-500">No activity recorded yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="section-title">Activity Timeline</h3>
      </div>
      <div className="card-body">
        <div className="relative space-y-4">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

          {activities.map((activity, i) => {
            const icon = ACTIVITY_ICONS[activity.activity_type] || (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            );
            const color = ACTIVITY_COLORS[activity.activity_type] || "bg-slate-100 text-slate-600";

            return (
              <div key={activity.id || i} className="flex gap-4 relative">
                <div className={clsx("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10", color)}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm font-medium text-slate-800">{activity.message}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {format(new Date(activity.created_at), "MMM d, yyyy 'at' HH:mm")}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Integration Status ───────────────────────────────────────────────────────

const SYNC_STATUS_STYLES: Record<string, string> = {
  success: "text-green-700 bg-green-100",
  failed: "text-red-700 bg-red-100",
  pending: "text-amber-700 bg-amber-100",
  skipped: "text-slate-600 bg-slate-100",
};

function IntegrationStatus({ syncs }: { syncs: IntegrationSync[] }) {
  if (!syncs || syncs.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="section-title">Integration Status</h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-500">No integrations synced yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="section-title">Integration Status</h3>
      </div>
      <div className="card-body">
        <div className="space-y-3">
          {syncs.map((sync) => (
            <div key={sync.id} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800 capitalize">
                  {sync.integration_name.replace(/_/g, " ")}
                </p>
                {sync.external_id && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {sync.external_id}</p>
                )}
                {sync.error_message && (
                  <p className="text-xs text-red-500 mt-0.5">{sync.error_message}</p>
                )}
                {sync.synced_at && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {format(new Date(sync.synced_at), "MMM d, HH:mm")}
                  </p>
                )}
              </div>
              <span className={clsx("badge capitalize flex-shrink-0", SYNC_STATUS_STYLES[sync.sync_status])}>
                {sync.sync_status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Lead Detail Component ────────────────────────────────────────────────────

interface LeadDetailProps {
  lead: Lead;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="text-xs font-medium text-slate-500 w-28 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800 flex-1">{value}</span>
    </div>
  );
}

export function LeadDetail({ lead }: LeadDetailProps) {
  return (
    <div className="space-y-6">
      {/* Profile + Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile card */}
        <div className="lg:col-span-2 card">
          <div className="card-header flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">
                {lead.first_name[0]}{lead.last_name[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {lead.first_name} {lead.last_name}
              </h2>
              {lead.job_title && lead.company ? (
                <p className="text-sm text-slate-500">{lead.job_title} at {lead.company}</p>
              ) : (
                <p className="text-sm text-slate-500">{lead.job_title || lead.company || lead.email}</p>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div className="divide-y divide-slate-50">
                <InfoRow label="Email" value={
                  <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                } />
                <InfoRow label="Phone" value={lead.phone} />
                <InfoRow label="Company" value={lead.company} />
                <InfoRow label="Industry" value={lead.industry} />
                <InfoRow label="Company Size" value={lead.company_size} />
              </div>
              <div className="divide-y divide-slate-50">
                <InfoRow label="Annual Revenue" value={lead.annual_revenue} />
                <InfoRow label="Source" value={lead.source} />
                <InfoRow label="Location" value={[lead.city, lead.country].filter(Boolean).join(", ")} />
                <InfoRow label="Website" value={
                  lead.website ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">{lead.website}</a>
                  ) : null
                } />
                <InfoRow label="LinkedIn" value={
                  lead.linkedin_url ? (
                    <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View Profile</a>
                  ) : null
                } />
              </div>
            </div>
            {lead.message && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-500 mb-1">Message / Notes</p>
                <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 px-3 py-2 rounded-lg">
                  {lead.message}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Score card */}
        <div className="card flex flex-col items-center justify-center p-8 text-center">
          <p className="text-sm font-medium text-slate-500 mb-2">Lead Score</p>
          <div className={clsx(
            "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-extrabold mb-4",
            lead.score >= 75 ? "bg-green-100 text-green-700" :
            lead.score >= 50 ? "bg-amber-100 text-amber-700" :
            lead.score >= 25 ? "bg-orange-100 text-orange-700" :
            "bg-slate-100 text-slate-600"
          )}>
            {lead.score}
          </div>
          <StatusBadge status={lead.qualification_status} />
          <div className="mt-4 w-full bg-slate-100 rounded-full h-2">
            <div
              className={clsx("h-2 rounded-full transition-all",
                lead.score >= 75 ? "bg-green-500" :
                lead.score >= 50 ? "bg-amber-500" :
                lead.score >= 25 ? "bg-orange-500" :
                "bg-slate-400"
              )}
              style={{ width: `${lead.score}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">out of 100</p>
          {lead.qualified_at && (
            <p className="text-xs text-slate-400 mt-2">
              Qualified {format(new Date(lead.qualified_at), "MMM d, yyyy")}
            </p>
          )}
        </div>
      </div>

      {/* AI Analysis */}
      {lead.ai_analysis_json && (
        <AIAnalysisSection analysis={lead.ai_analysis_json} />
      )}

      {/* Activities + Integrations side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityTimeline activities={lead.activities || []} />
        <IntegrationStatus syncs={lead.integration_syncs || []} />
      </div>
    </div>
  );
}

export default LeadDetail;
