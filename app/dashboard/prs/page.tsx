"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import {
  GitPullRequest,
  Search,
  ExternalLink,
  GitMerge,
  XCircle,
  Clock,
  FileCode,
} from "lucide-react";
import type { PullRequest } from "@/types";

type FilterState = "all" | "open" | "closed";

export default function PRsPage() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterState>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/github/prs?state=${filter}`)
      .then((r) => r.json())
      .then((data) => setPrs(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = prs.filter(
    (pr) =>
      pr.title.toLowerCase().includes(search.toLowerCase()) ||
      String(pr.number).includes(search) ||
      pr.user.login.toLowerCase().includes(search.toLowerCase())
  );

  function StateIcon({ state }: { state: string }) {
    if (state === "open") return <GitPullRequest size={14} color="#10b981" />;
    if (state === "merged") return <GitMerge size={14} color="#a78bfa" />;
    return <XCircle size={14} color="#ef4444" />;
  }

  function StatePill({ state }: { state: string }) {
    const cls =
      state === "open"
        ? "badge-open"
        : state === "merged"
        ? "badge-merged"
        : "badge-closed";
    return <span className={`badge ${cls}`}>{state}</span>;
  }

  function HealthBadge({ prNumber }: { prNumber: number }) {
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [data, setData] = useState<any>(null);

    async function checkHealth() {
      setStatus("loading");
      try {
        const res = await fetch("/api/prs/health", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prNumber }),
        });
        const result = await res.json();
        setData(result);
        setStatus("done");
      } catch (e) {
        setStatus("error");
      }
    }

    if (status === "idle") {
      return (
        <button 
          onClick={checkHealth}
          style={{
            fontSize: 10,
            padding: "4px 8px",
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 4,
            color: "#818cf8",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Check Health
        </button>
      );
    }

    if (status === "loading") {
      return <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 4 }} />;
    }

    if (status === "error") {
      return <span style={{ fontSize: 10, color: "#ef4444" }}>Error</span>;
    }

    const { classification, score } = data;
    const color = 
      classification === "Ready for Review" ? "#10b981" :
      classification === "Needs More Info" ? "#f59e0b" : "#ef4444";

    return (
      <div 
        title={data.reasoning}
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: 2,
          cursor: "help"
        }}
      >
        <span 
          style={{ 
            fontSize: 9, 
            fontWeight: 800, 
            color, 
            textTransform: "uppercase",
            background: `${color}15`,
            padding: "1px 4px",
            borderRadius: 3,
            lineHeight: 1,
            whiteSpace: "nowrap"
          }}
        >
          {classification.split(' ').slice(-1)}
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#f1f5f9", lineHeight: 1 }}>
          {score}
        </span>
      </div>
    );
  }

  function AIDetectionBadge({ prNumber }: { prNumber: number }) {
    const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
    const [data, setData] = useState<any>(null);

    async function checkAI() {
      setStatus("loading");
      try {
        const res = await fetch("/api/prs/detect-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prNumber }),
        });
        const result = await res.json();
        setData(result);
        setStatus("done");
      } catch (e) {
        setStatus("error");
      }
    }

    if (status === "idle") {
      return (
        <button 
          onClick={checkAI}
          style={{
            fontSize: 10,
            padding: "4px 8px",
            background: "rgba(6,182,212,0.1)",
            border: "1px solid rgba(6,182,212,0.2)",
            borderRadius: 4,
            color: "#06b6d4",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          Verify AI
        </button>
      );
    }

    if (status === "loading") {
      return <div className="skeleton" style={{ height: 20, width: 80, borderRadius: 4 }} />;
    }

    if (status === "error") return null;

    const score = data.score ?? 0;
    const isBot = data.isBot ?? false;
    const reasoning = JSON.parse(data.reasoning || "[]");

    return (
      <div 
        title={reasoning.join("\n")}
        style={{ 
          display: "inline-flex", 
          alignItems: "center", 
          gap: 6,
          cursor: "help",
          padding: "5px 10px",
          borderRadius: 8,
          background: isBot ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)",
          border: `1px solid ${isBot ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)"}`,
          boxShadow: isBot ? "0 0 10px rgba(239,68,68,0.1)" : "none",
          transition: "all 0.2s ease"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: isBot ? "#fca5a5" : "#6ee7b7", letterSpacing: "-0.02em" }}>
          {score}%
        </span>
        {isBot && (
          <div 
            style={{ 
              width: 6, 
              height: 6, 
              borderRadius: "50%", 
              background: "#ef4444", 
              boxShadow: "0 0 8px #ef4444" 
            }} 
          />
        )}
      </div>
    );
  }

  const GRID_COLS = "40px 1fr 100px 80px 100px 100px 70px 70px 100px 40px";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header
        title="Pull Requests"
        subtitle={`${filtered.length} PRs shown`}
      />

      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
        {/* ── Toolbar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 20,
            flexWrap: "wrap",
          }}
        >
          <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
            <Search
              size={14}
              color="#475569"
              style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              className="input"
              style={{ paddingLeft: 36 }}
              placeholder="Search PRs by title, number, author…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {(["all", "open", "closed"] as FilterState[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={filter === s ? "btn-primary" : "btn-ghost"}
              style={{ padding: "8px 18px", textTransform: "capitalize", fontSize: 13 }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ── Table ── */}
        <div
          className="card"
          style={{ padding: 0, overflow: "hidden" }}
        >
          {/* Header row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: GRID_COLS,
              padding: "10px 20px",
              borderBottom: "1px solid var(--border-subtle)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#334155",
              textTransform: "uppercase",
              gap: 12,
              alignItems: "center",
            }}
          >
            <span>#</span>
            <span>Title</span>
            <span>Author</span>
            <span>Status</span>
            <span style={{ textAlign: "center" }}>Health</span>
            <span style={{ textAlign: "center" }}>AI Prob</span>
            <span style={{ textAlign: "center" }}>+</span>
            <span style={{ textAlign: "center" }}>−</span>
            <span>Updated</span>
            <span />
          </div>

          {loading ? (
            <div style={{ padding: 20 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 54, borderRadius: 6, marginBottom: 6 }}
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "60px 40px", textAlign: "center", color: "#334155", fontSize: 14 }}>
              <FileCode size={32} style={{ margin: "0 auto 12px", display: "block", color: "#1e293b" }} />
              No pull requests found.
            </div>
          ) : (
            filtered.map((pr) => (
              <div
                key={pr.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: GRID_COLS,
                  padding: "12px 20px",
                  borderBottom: "1px solid rgba(99,102,241,0.06)",
                  gap: 12,
                  alignItems: "center",
                  transition: "background 0.15s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ fontSize: 12, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>
                  #{pr.number}
                </div>

                <div style={{ minWidth: 0 }}>
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
                    <StateIcon state={pr.state} />
                    &nbsp;{pr.title}
                    {pr.draft && (
                      <span className="badge badge-draft" style={{ marginLeft: 8 }}>
                        draft
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>
                    {pr.base.ref} ← {pr.head.ref}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <img
                    src={pr.user.avatar_url}
                    alt={pr.user.login}
                    width={20}
                    height={20}
                    style={{ borderRadius: "50%", flexShrink: 0 }}
                  />
                  <span
                    style={{
                      fontSize: 12,
                      color: "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {pr.user.login}
                  </span>
                </div>

                <StatePill state={pr.state} />

                <div style={{ textAlign: "center" }}>
                   <HealthBadge prNumber={pr.number} />
                </div>

                <div style={{ textAlign: "center" }}>
                   <AIDetectionBadge prNumber={pr.number} />
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#10b981",
                    textAlign: "center",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  +{pr.additions.toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#ef4444",
                    textAlign: "center",
                    fontFamily: "JetBrains Mono, monospace",
                  }}
                >
                  -{pr.deletions.toLocaleString()}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#475569" }}>
                  <Clock size={11} color="#334155" />
                  {new Date(pr.updated_at).toLocaleDateString()}
                </div>

                <a href={pr.html_url} target="_blank" rel="noreferrer">
                  <ExternalLink size={13} color="#475569" />
                </a>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
