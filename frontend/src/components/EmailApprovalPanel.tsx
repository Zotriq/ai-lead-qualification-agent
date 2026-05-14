"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { format } from "date-fns";
import type { FollowUpEmail, EmailStatus } from "@/lib/types";

// ─── Email Status Badge ───────────────────────────────────────────────────────

const EMAIL_STATUS_STYLES: Record<EmailStatus, string> = {
  draft: "bg-slate-100 text-slate-600",
  pending_approval: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  sent: "bg-blue-100 text-blue-700",
  failed: "bg-red-200 text-red-800",
};

function EmailStatusBadge({ status }: { status: EmailStatus }) {
  const label = status.replace(/_/g, " ");
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize",
        EMAIL_STATUS_STYLES[status]
      )}
    >
      {label}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface EmailApprovalPanelProps {
  email: FollowUpEmail | null;
  loading?: boolean;
  onApprove: (approvedBy: string) => Promise<void>;
  onReject: () => Promise<void>;
  onSend: () => Promise<void>;
  onSave: (subject: string, body: string) => Promise<void>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmailApprovalPanel({
  email,
  loading,
  onApprove,
  onReject,
  onSend,
  onSave,
}: EmailApprovalPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [approverName, setApproverName] = useState("");
  const [showApproverInput, setShowApproverInput] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="card-header">
          <div className="h-5 bg-slate-200 rounded w-1/3" />
        </div>
        <div className="card-body space-y-3">
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-24 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="card">
        <div className="card-header">
          <h3 className="section-title">Follow-Up Email</h3>
        </div>
        <div className="card-body">
          <p className="text-sm text-slate-500">
            No follow-up email generated yet. Qualify this lead to generate a
            personalized email draft.
          </p>
        </div>
      </div>
    );
  }

  const canEdit = !["sent", "failed"].includes(email.status);
  const canApprove = ["draft", "pending_approval"].includes(email.status);
  const canReject = ["pending_approval", "approved"].includes(email.status);
  const canSend = email.status === "approved";

  const startEdit = () => {
    setEditSubject(email.subject);
    setEditBody(email.body);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditSubject("");
    setEditBody("");
  };

  const handleSave = async () => {
    setActionLoading("save");
    try {
      await onSave(editSubject, editBody);
      setIsEditing(false);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async () => {
    if (!approverName.trim()) return;
    setActionLoading("approve");
    try {
      await onApprove(approverName.trim());
      setShowApproverInput(false);
      setApproverName("");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading("reject");
    try {
      await onReject();
    } finally {
      setActionLoading(null);
    }
  };

  const handleSend = async () => {
    setActionLoading("send");
    try {
      await onSend();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="card animate-fade-in">
      {/* Header */}
      <div className="card-header flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="section-title">Follow-Up Email</h3>
          <EmailStatusBadge status={email.status} />
          {email.ai_generated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              AI Generated
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canEdit && !isEditing && (
            <button onClick={startEdit} className="btn-ghost text-xs py-1.5 px-3">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="card-body space-y-4">
        {/* Subject */}
        <div>
          <label className="label">Subject</label>
          {isEditing ? (
            <input
              type="text"
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              className="input"
            />
          ) : (
            <p className="text-sm text-slate-800 font-medium bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
              {email.subject}
            </p>
          )}
        </div>

        {/* Body */}
        <div>
          <label className="label">Email Body</label>
          {isEditing ? (
            <textarea
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              rows={10}
              className="input resize-y font-mono text-xs leading-relaxed"
            />
          ) : (
            <div className="text-sm text-slate-700 bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
              {email.body}
            </div>
          )}
        </div>

        {/* Edit action buttons */}
        {isEditing && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={actionLoading === "save"}
              className="btn-primary text-xs py-1.5 px-4"
            >
              {actionLoading === "save" ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={cancelEdit} className="btn-secondary text-xs py-1.5 px-4">
              Cancel
            </button>
          </div>
        )}

        {/* Metadata */}
        {(email.approved_by || email.sent_at) && (
          <div className="flex flex-wrap gap-4 pt-1 border-t border-slate-100">
            {email.approved_by && (
              <div>
                <p className="text-xs text-slate-400">Approved by</p>
                <p className="text-xs font-medium text-slate-700">{email.approved_by}</p>
                {email.approved_at && (
                  <p className="text-xs text-slate-400">
                    {format(new Date(email.approved_at), "MMM d, yyyy HH:mm")}
                  </p>
                )}
              </div>
            )}
            {email.sent_at && (
              <div>
                <p className="text-xs text-slate-400">Sent at</p>
                <p className="text-xs font-medium text-slate-700">
                  {format(new Date(email.sent_at), "MMM d, yyyy HH:mm")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action buttons (not in edit mode) */}
        {!isEditing && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            {/* Approve flow */}
            {canApprove && !showApproverInput && (
              <button
                onClick={() => setShowApproverInput(true)}
                className="btn-success text-xs py-1.5 px-4"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Approve
              </button>
            )}

            {showApproverInput && (
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="text"
                  placeholder="Your name"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="input py-1.5 text-xs w-40"
                  onKeyDown={(e) => e.key === "Enter" && handleApprove()}
                />
                <button
                  onClick={handleApprove}
                  disabled={!approverName.trim() || actionLoading === "approve"}
                  className="btn-success text-xs py-1.5 px-3"
                >
                  {actionLoading === "approve" ? "..." : "Confirm"}
                </button>
                <button
                  onClick={() => { setShowApproverInput(false); setApproverName(""); }}
                  className="btn-secondary text-xs py-1.5 px-3"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Reject */}
            {canReject && (
              <button
                onClick={handleReject}
                disabled={actionLoading === "reject"}
                className="btn-danger text-xs py-1.5 px-4"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                {actionLoading === "reject" ? "..." : "Reject"}
              </button>
            )}

            {/* Send */}
            {canSend && (
              <button
                onClick={handleSend}
                disabled={actionLoading === "send"}
                className="btn-primary text-xs py-1.5 px-4"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                {actionLoading === "send" ? "Sending..." : "Send Email"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailApprovalPanel;
