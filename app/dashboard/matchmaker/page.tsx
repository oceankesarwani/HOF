"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import { Users, ChevronDown, Trophy, GitCommit, AlertCircle } from "lucide-react";
import type { MatchmakerResult, PullRequest, ContributorStat } from "@/types";

function ContributorCard({
  contributor,
  rank,
}: {
  contributor: ContributorStat;
  rank: number;
}) {
  const rankColors = ["#f59e0b", "#94a3b8", "#cd7c56"];
  const rankColor = rankColors[rank] ?? "#475569";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 8,
        background: rank === 0 ? "rgba(245,158,11,0.06)" : "rgba(17,24,39,0.5)",
        border: rank === 0 ? "1px solid rgba(245,158,11,0.2)" : "1px solid rgba(99,102,241,0.1)",
        marginBottom: 6,
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: `${rankColor}20`,
          border: `1px solid ${rankColor}40`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          fontWeight: 700,
          color: rankColor,
          flexShrink: 0,
        }}
      >
        {rank + 1}
      </div>
      <img
        src={contributor.avatar_url || `https://github.com/${contributor.login}.png?size=40`}
        alt={contributor.login}
        width={28}
        height={28}
        style={{ borderRadius: "50%", flexShrink: 0 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <a
          href={contributor.html_url || `https://github.com/${contributor.login}`}
          target="_blank"
          rel="noreferrer"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: rank === 0 ? "#fbbf24" : "#e2e8f0",
            textDecoration: "none",
          }}
        >
          @{contributor.login}
        </a>
        <div
          style={{
            fontSize: 11,
            color: "#475569",
            marginTop: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {contributor.files.length} file(s) touched
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <GitCommit size={11} color="#475569" />
        <span style={{ fontSize: 12, fontWeight: 700, color: rankColor }}>
          {contributor.commits}
        </span>
      </div>
    </div>
  );
}

export default function MatchmakerPage() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<number | null>(null);
  const [result, setResult] = useState<MatchmakerResult | null>(null);
  const [loadingPRs, setLoadingPRs] = useState(true);
  const [loadingResult, setLoadingResult] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/github/prs?state=open")
      .then((r) => r.json())
      .then((data) => setPrs(Array.isArray(data) ? data : []))
      .finally(() => setLoadingPRs(false));
  }, []);

  async function runMatchmaker(prNumber: number) {
    setLoadingResult(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/matchmaker?pr=${prNumber}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoadingResult(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header
        title="Contributor Matchmaker"
        subtitle="Find the top expert for each changed file"
      />

      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
        {/* PR Selector */}
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>
            Select a Pull Request
          </h2>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <select
                className="input"
                style={{ appearance: "none", paddingRight: 36, cursor: "pointer" }}
                value={selectedPR ?? ""}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!isNaN(v)) setSelectedPR(v);
                }}
                disabled={loadingPRs}
              >
                <option value="">
                  {loadingPRs ? "Loading PRs…" : "— Select a PR —"}
                </option>
                {prs.map((pr) => (
                  <option key={pr.number} value={pr.number}>
                    #{pr.number} · {pr.title.slice(0, 60)}
                    {pr.title.length > 60 ? "…" : ""}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                color="#475569"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                }}
              />
            </div>

            <button
              className="btn-primary"
              disabled={!selectedPR || loadingResult}
              onClick={() => selectedPR && runMatchmaker(selectedPR)}
            >
              <Users size={15} />
              {loadingResult ? "Analyzing…" : "Find Experts"}
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 8,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            <AlertCircle size={14} color="#ef4444" /> {error}
          </div>
        )}

        {loadingResult && (
          <div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 140, borderRadius: 12, marginBottom: 12 }}
              />
            ))}
          </div>
        )}

        {result && (
          <div>
            {/* Overall Top */}
            {result.overallTop && (
              <div
                style={{
                  padding: "20px 24px",
                  borderRadius: 14,
                  background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.08))",
                  border: "1px solid rgba(245,158,11,0.3)",
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                }}
              >
                <Trophy size={32} color="#f59e0b" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#92400e", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Top Reviewer for PR #{result.prNumber}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fbbf24", marginTop: 4 }}>
                    @{result.overallTop.login}
                  </div>
                  <div style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>
                    {result.overallTop.commits} commits across {result.overallTop.files.length} changed file(s)
                  </div>
                </div>
                <img
                  src={result.overallTop.avatar_url || `https://github.com/${result.overallTop.login}.png?size=80`}
                  width={56}
                  height={56}
                  style={{ borderRadius: "50%", border: "3px solid rgba(245,158,11,0.4)" }}
                  alt={result.overallTop.login}
                />
              </div>
            )}

            {/* Per-File Breakdown */}
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>
              File-Level Experts
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {result.files.map((file) => (
                <div key={file.filename} className="card" style={{ padding: "18px 20px" }}>
                  <div
                    style={{
                      fontFamily: "JetBrains Mono, monospace",
                      fontSize: 12,
                      color: "#34d399",
                      marginBottom: 12,
                      padding: "4px 10px",
                      background: "rgba(52,211,153,0.1)",
                      borderRadius: 5,
                      display: "inline-block",
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.filename}
                  </div>
                  {file.topContributors.length === 0 ? (
                    <div style={{ fontSize: 12, color: "#334155", padding: "8px 0" }}>
                      No commit history found for this file.
                    </div>
                  ) : (
                    file.topContributors.map((c, i) => (
                      <ContributorCard key={c.login} contributor={c} rank={i} />
                    ))
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!result && !loadingResult && !error && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 24px",
              color: "#334155",
            }}
          >
            <Users size={48} color="#1e293b" style={{ margin: "0 auto 16px" }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>
              Select a PR to identify the best reviewer
            </div>
            <div style={{ fontSize: 13, color: "#334155", marginTop: 8 }}>
              CommitGuard analyzes git history for each changed file and ranks contributors by commit count.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
