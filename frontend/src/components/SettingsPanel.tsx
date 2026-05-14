"use client";

import React, { useState } from "react";
import clsx from "clsx";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SettingField {
  key: string;
  label: string;
  value: string;
  type?: "text" | "number" | "select" | "textarea";
  options?: string[];
  description?: string;
}

interface SettingsPanelProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  fields: SettingField[];
  badge?: {
    label: string;
    color?: "blue" | "green" | "amber" | "red" | "slate";
  };
  onSave?: (values: Record<string, string>) => Promise<void>;
}

const BADGE_STYLES = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-green-100 text-green-700",
  amber: "bg-amber-100 text-amber-700",
  red: "bg-red-100 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

// ─── Settings Panel Component ─────────────────────────────────────────────────

export function SettingsPanel({
  title,
  description,
  icon,
  fields,
  badge,
  onSave,
}: SettingsPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );
  const [savedValues, setSavedValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (onSave) await onSave(values);
      setSavedValues({ ...values });
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setValues({ ...savedValues });
    setIsEditing(false);
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="card-header flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="section-title text-base">{title}</h3>
              {badge && (
                <span className={clsx("badge", BADGE_STYLES[badge.color ?? "slate"])}>
                  {badge.label}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs text-slate-500 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="btn-ghost text-xs py-1.5 px-3 flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={handleCancel} className="btn-secondary text-xs py-1.5 px-3">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Fields */}
      <div className="card-body space-y-4">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="label">{field.label}</label>
            {field.description && (
              <p className="text-xs text-slate-400 mb-1">{field.description}</p>
            )}
            {!isEditing ? (
              <p className="text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                {savedValues[field.key] || (
                  <span className="text-slate-400 italic">Not configured</span>
                )}
              </p>
            ) : field.type === "select" && field.options ? (
              <select
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="input"
              >
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={3}
                className="input resize-y"
              />
            ) : (
              <input
                type={field.type || "text"}
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="input"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsPanel;
