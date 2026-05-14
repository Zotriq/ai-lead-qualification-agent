"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  fetchLead,
  fetchFollowUp,
  updateFollowUp,
  approveEmail,
  rejectEmail,
  sendEmail,
  qualifyLead,
} from "@/lib/api";
import type { Lead, FollowUpEmail } from "@/lib/types";
import { LeadDetail } from "@/components/LeadDetail";
import { EmailApprovalPanel } from "@/components/EmailApprovalPanel";

// ─── Lead Detail Page ─────────────────────────────────────────────────────────

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = typeof params.id === "string" ? parseInt(params.id, 10) : null;

  const [lead, setLead] = useState<Lead | null>(null);
  const [email, setEmail] = useState<FollowUpEmail | null>(null);
  const [loadingLead, setLoadingLead] = useState(true);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [qualifying, setQualifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Show toast helper
  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadLead = useCallback(async () => {
    if (!leadId) return;
    setLoadingLead(true);
    setError(null);
    try {
      const data = await fetchLead(leadId);
      setLead(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load lead");
    } finally {
      setLoadingLead(false);
    }
  }, [leadId]);

  const loadEmail = useCallback(async () => {
    if (!leadId) return;
    setLoadingEmail(true);
    try {
      const data = await fetchFollowUp(leadId);
      setEmail(data);
    } catch {
      // No email yet — not an error state
      setEmail(null);
    } finally {
      setLoadingEmail(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadLead();
    loadEmail();
  }, [loadLead, loadEmail]);

  const handleQualify = async () => {
    if (!leadId) return;
    setQualifying(true);
    try {
      const updated = await qualifyLead(leadId);
      setLead(updated);
      await loadEmail();
      showToast("Lead qualified successfully!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to qualify lead", "error");
    } finally {
      setQualifying(false);
    }
  };

  const handleApprove = async (approvedBy: string) => {
    if (!leadId) return;
    try {
      const updated = await approveEmail(leadId, approvedBy);
      setEmail(updated);
      showToast("Email approved!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to approve email", "error");
    }
  };

  const handleReject = async () => {
    if (!leadId) return;
    try {
      const updated = await rejectEmail(leadId);
      setEmail(updated);
      showToast("Email rejected.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to reject email", "error");
    }
  };

  const handleSend = async () => {
    if (!leadId) return;
    try {
      const updated = await sendEmail(leadId);
      setEmail(updated);
      showToast("Email sent!");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to send email", "error");
    }
  };

  const handleSaveEmail = async (subject: string, body: string) => {
    if (!leadId) return;
    try {
      const updated = await updateFollowUp(leadId, { subject, body });
      setEmail(updated);
      showToast("Email draft saved.");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save email", "error");
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loadingLead) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-200 rounded" />
          <div className="h-6 bg-slate-200 rounded w-48" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 card p-6 h-48" />
          <div className="card p-6 h-48" />
        </div>
        <div className="card p-6 h-40" />
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-slate-800 font-semibold">Lead not found</p>
        <p className="text-slate-500 text-sm mt-1">{error || "This lead may have been deleted."}</p>
        <button onClick={() => router.push("/leads")} className="btn-primary mt-4">
          Back to Leads
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast notification */}
      {toast && (
        <div
          className={clsx(
            "fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up",
            toast.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          )}
        >
          {toast.type === "success" ? (
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="btn-ghost py-2 px-3"
            aria-label="Go back"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {lead.first_name} {lead.last_name}
            </h1>
            <p className="text-slate-500 text-sm">Lead #{lead.id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadLead}
            className="btn-secondary text-sm"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          {!lead.is_qualified && (
            <button
              onClick={handleQualify}
              disabled={qualifying}
              className="btn-primary text-sm"
            >
              {qualifying ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Qualifying...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Run AI Qualification
                </>
              )}
            </button>
          )}
          {lead.is_qualified && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-semibold border border-green-200">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              AI Qualified
            </span>
          )}
        </div>
      </div>

      {/* Lead detail sections */}
      <LeadDetail lead={lead} />

      {/* Email approval panel */}
      <EmailApprovalPanel
        email={email}
        loading={loadingEmail}
        onApprove={handleApprove}
        onReject={handleReject}
        onSend={handleSend}
        onSave={handleSaveEmail}
      />
    </div>
  );
}
