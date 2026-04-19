"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import {
  GitPullRequest,
  GitMerge,
  Clock,
  Zap,
  TrendingUp,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import type { PullRequest, WebhookEvent } from "@/types";
import Link from "next/link";

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  glow,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  glow: string;
  sub?: string;
}) {
  return (
    <div
      className="card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        background: "rgba(17,24,39,0.7)",
        borderColor: `rgba(${hexRgb(color)}, 0.2)`,
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `rgba(${hexRgb(color)}, 0.12)`,
            border: `1px solid rgba(${hexRgb(color)}, 0.3)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 16px ${glow}`,
          }}
        >
          <Icon size={18} color={color} />
        </div>
        <TrendingUp size={14} color="#334155" />
      </div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em", lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

function PRRow({ pr }: { pr: PullRequest }) {
  const stateColor =
    pr.state === "open" ? "#10b981" : pr.state === "merged" ? "#a78bfa" : "#ef4444";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 20px",
        borderBottom: "1px solid rgba(16,185,129,0.07)",
        transition: "background 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(16,185,129,0.05)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <GitPullRequest size={16} color={stateColor} style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#e2e8f0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {pr.title}
        </div>
        <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>
          #{pr.number} · {pr.user.login} ·{" "}
          {new Date(pr.updated_at).toLocaleDateString()}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 11,
            color: "#10b981",
            background: "rgba(16,185,129,0.1)",
            padding: "2px 7px",
            borderRadius: 4,
          }}
        >
          +{pr.additions}
        </span>
        <span
          style={{
            fontSize: 11,
            color: "#ef4444",
            background: "rgba(239,68,68,0.1)",
            padding: "2px 7px",
            borderRadius: 4,
          }}
        >
          -{pr.deletions}
        </span>
        <a href={pr.html_url} target="_blank" rel="noreferrer">
          <ExternalLink size={12} color="#475569" />
        </a>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [prRes, evRes] = await Promise.all([
          fetch("/api/github/prs"),
          fetch("/api/webhook"),
        ]);
        if (!prRes.ok) throw new Error(await prRes.text());
        const prData = await prRes.json();
        const evData = evRes.ok ? await evRes.json() : [];
        setPrs(prData);
        setEvents(evData);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const open = prs.filter((p) => p.state === "open").length;
  const merged = prs.filter((p) => p.state === "merged").length;
  const drafts = prs.filter((p) => p.draft).length;
  const avgAge =
    prs.length > 0
      ? Math.round(
          prs.reduce((acc, p) => {
            const days = (Date.now() - new Date(p.created_at).getTime()) / 86400000;
            return acc + days;
          }, 0) / prs.length
        )
      : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header title="Overview" subtitle="GitHub PR intelligence at a glance" />

      <div style={{ flex: 1, padding: "28px", overflowY: "auto" }}>
        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "14px 18px",
              borderRadius: 10,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
              fontSize: 13,
              marginBottom: 24,
            }}
          >
            <AlertCircle size={16} color="#ef4444" />
            <span>
              <strong>API Error:</strong> {error}. Check your{" "}
              <code style={{ fontSize: 11 }}>GITHUB_TOKEN</code> and{" "}
              <code style={{ fontSize: 11 }}>NEXT_PUBLIC_GITHUB_OWNER/REPO</code> in{" "}
              <code style={{ fontSize: 11 }}>.env.local</code>.
            </span>
          </div>
        )}

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />
            ))
          ) : (
            <>
              <StatCard
                icon={GitPullRequest}
                label="Open PRs"
                value={open}
                color="#10b981"
                glow="rgba(16,185,129,0.3)"
                sub={`${drafts} draft`}
              />
              <StatCard
                icon={GitMerge}
                label="Merged PRs"
                value={merged}
                color="#059669"
                glow="rgba(5,150,105,0.3)"
              />
              <StatCard
                icon={Clock}
                label="Avg Age (days)"
                value={avgAge}
                color="#f59e0b"
                glow="rgba(245,158,11,0.3)"
              />
              <StatCard
                icon={Zap}
                label="Webhook Events"
                value={events.length}
                color="#06b6d4"
                glow="rgba(6,182,212,0.3)"
                sub="since startup"
              />
            </>
          )}
        </div>

        {/* Recent PRs + Events */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}>
          {/* PR List */}
          <div
            className="card"
            style={{ padding: 0, overflow: "hidden" }}
          >
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid rgba(16, 185, 129, 0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Recent Pull Requests</h2>
              <Link href="/dashboard/prs" style={{ fontSize: 12, color: "#10b981", textDecoration: "none" }}>
                View all →
              </Link>
            </div>
            {loading ? (
              <div style={{ padding: 20 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: 52, borderRadius: 6, marginBottom: 8 }} />
                ))}
              </div>
            ) : prs.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#475569", fontSize: 14 }}>
                No PRs found. Configure your GitHub repo in .env.local
              </div>
            ) : (
              prs.slice(0, 8).map((pr) => <PRRow key={pr.id} pr={pr} />)
            )}
          </div>

          {/* Webhook Events */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "18px 20px",
                borderBottom: "1px solid rgba(16, 185, 129, 0.1)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div className="dot-online" />
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>Webhook Events</h2>
            </div>
            <div style={{ padding: 16 }}>
              {events.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "#334155", fontSize: 13 }}>
                  <Zap size={20} color="#334155" style={{ margin: "0 auto 8px", display: "block" }} />
                  No events yet.
                  <br />
                  <span style={{ fontSize: 11, fontFamily: "JetBrains Mono, monospace", color: "#1e293b" }}>
                    POST /api/webhook
                  </span>
                </div>
              ) : (
                events.slice(0, 6).map((ev, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 8,
                      marginBottom: 6,
                      background: "rgba(16,185,129,0.06)",
                      border: "1px solid rgba(16,185,129,0.1)",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#34d399" }}>
                      PR #{ev.pr_number} · {ev.action}
                    </div>
                    <div style={{ fontSize: 11, color: "#475569", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {ev.title}
                    </div>
                    <div style={{ fontSize: 10, color: "#334155", marginTop: 3 }}>
                      {ev.sender} · {new Date(ev.received_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function hexRgb(hex: string): string {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!r) return "16,185,129";
  return `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}`;
}
