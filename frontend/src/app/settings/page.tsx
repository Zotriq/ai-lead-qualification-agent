"use client";

import React from "react";
import { SettingsPanel } from "@/components/SettingsPanel";

// ─── Settings Page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure your AI Lead Qualification Agent
        </p>
      </div>

      {/* MVP notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-amber-800">MVP Configuration</p>
          <p className="text-xs text-amber-700 mt-0.5">
            These settings panels are placeholder configurations for the MVP. In production,
            changes will persist to the backend. For now, edits are local to this session.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scoring Thresholds */}
        <SettingsPanel
          title="Scoring Thresholds"
          description="Configure score cutoffs for each qualification tier"
          badge={{ label: "Core", color: "blue" }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          fields={[
            {
              key: "hot_threshold",
              label: "Hot Lead Threshold",
              value: "75",
              type: "number",
              description: "Score >= this value is classified as Hot",
            },
            {
              key: "warm_threshold",
              label: "Warm Lead Threshold",
              value: "50",
              type: "number",
              description: "Score >= this value (but < Hot) is classified as Warm",
            },
            {
              key: "cold_threshold",
              label: "Cold Lead Threshold",
              value: "25",
              type: "number",
              description: "Score >= this value (but < Warm) is classified as Cold",
            },
          ]}
        />

        {/* Target Industries */}
        <SettingsPanel
          title="Target Industries"
          description="Define priority industries for higher scoring"
          badge={{ label: "ICP", color: "green" }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          fields={[
            {
              key: "target_industries",
              label: "Target Industries (comma-separated)",
              value: "SaaS, FinTech, HealthTech, E-commerce, B2B Software",
              type: "textarea",
              description: "Leads from these industries receive a scoring bonus",
            },
            {
              key: "industry_bonus",
              label: "Industry Match Bonus",
              value: "15",
              type: "number",
              description: "Score bonus for matching target industry",
            },
          ]}
        />

        {/* Ideal Customer Profile */}
        <SettingsPanel
          title="Ideal Customer Profile"
          description="Define your ICP for AI-assisted qualification"
          badge={{ label: "AI Config", color: "blue" }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
          fields={[
            {
              key: "company_size",
              label: "Ideal Company Size",
              value: "51-200, 201-500",
              type: "text",
              description: "Employee count ranges",
            },
            {
              key: "annual_revenue",
              label: "Minimum Annual Revenue",
              value: "$1M",
              type: "text",
            },
            {
              key: "job_titles",
              label: "Target Job Titles (comma-separated)",
              value: "CTO, VP Engineering, Head of Product, CEO, Founder",
              type: "textarea",
              description: "Decision makers and influencers",
            },
          ]}
        />

        {/* Slack Webhook */}
        <SettingsPanel
          title="Slack Notifications"
          description="Receive real-time alerts for hot leads and qualified emails"
          badge={{ label: "Integration", color: "slate" }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          fields={[
            {
              key: "slack_webhook_url",
              label: "Slack Webhook URL",
              value: "",
              type: "text",
              description: "Incoming webhook URL from your Slack app configuration",
            },
            {
              key: "notify_on",
              label: "Notify on",
              value: "Hot Lead, Email Approved, Email Sent",
              type: "text",
              description: "Comma-separated list of events to notify",
            },
          ]}
        />

        {/* CRM Provider */}
        <SettingsPanel
          title="CRM Integration"
          description="Sync qualified leads to your CRM automatically"
          badge={{ label: "Integration", color: "slate" }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          fields={[
            {
              key: "crm_provider",
              label: "CRM Provider",
              value: "HubSpot",
              type: "select",
              options: ["HubSpot", "Salesforce", "Pipedrive", "Zoho CRM", "None"],
            },
            {
              key: "crm_api_key",
              label: "CRM API Key",
              value: "",
              type: "text",
              description: "API key or access token for CRM authentication",
            },
            {
              key: "sync_on_qualify",
              label: "Auto-sync on Qualification",
              value: "Yes",
              type: "select",
              options: ["Yes", "No"],
              description: "Automatically push lead to CRM when qualified",
            },
          ]}
        />

        {/* Email Sending Mode */}
        <SettingsPanel
          title="Email Sending"
          description="Configure how follow-up emails are sent"
          badge={{ label: "Email", color: "blue" }}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          fields={[
            {
              key: "email_mode",
              label: "Email Sending Mode",
              value: "Manual (Approval Required)",
              type: "select",
              options: [
                "Manual (Approval Required)",
                "Auto-send for Hot Leads",
                "Fully Automated",
                "Disabled",
              ],
              description: "Controls when emails are sent to leads",
            },
            {
              key: "sender_name",
              label: "Sender Name",
              value: "Sales Team",
              type: "text",
            },
            {
              key: "sender_email",
              label: "Sender Email",
              value: "sales@example.com",
              type: "text",
            },
            {
              key: "email_provider",
              label: "Email Provider",
              value: "SMTP",
              type: "select",
              options: ["SMTP", "SendGrid", "Mailgun", "AWS SES", "Resend"],
            },
          ]}
        />
      </div>
    </div>
  );
}
