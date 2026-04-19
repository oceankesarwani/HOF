"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import {
  Brain,
  ChevronDown,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import type { PullRequest, SummarizeResult } from "@/types";

function MarkdownRenderer({ text }: { text: string }) {
  // Simple renderer for **bold**, bullet points
  const lines = text.split("\n");
  return (
    <div style={{ lineHeight: 1.8 }}>
      {lines.map((line, i) => {
        if (!line.trim()) return <br key={i} />;

        // Bold headers
        const boldLine = line.replace(/\*\*(.*?)\*\*/g, (_, m) => `<strong style="color:#e2e8f0">${m}</strong>`);

        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <div
              key={i}
              style={{ display: "flex", gap: 8, marginBottom: 4 }}
              dangerouslySetInnerHTML={{
                __html: `<span style="color:#10b981;margin-top:2px">›</span><span style="color:#94a3b8">${boldLine.slice(2)}</span>`,
              }}
            />
          );
        }

        return (
          <p
            key={i}
            style={{ color: "#94a3b8", marginBottom: 6 }}
            dangerouslySetInnerHTML={{ __html: boldLine }}
          />
        );
      })}
    </div>
  );
}

export default function SummarizerPage() {
  const [prs, setPrs] = useState<PullRequest[]>([]);
  const [selectedPR, setSelectedPR] = useState<number | null>(null);
  const [result, setResult] = useState<SummarizeResult | null>(null);
  const [loadingPRs, setLoadingPRs] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/github/prs")
      .then((r) => r.json())
      .then((data) => setPrs(Array.isArray(data) ? data : []))
      .finally(() => setLoadingPRs(false));
  }, []);

  async function summarize() {
    if (!selectedPR) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prNumber: selectedPR }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Summarization failed");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!result?.summary) return;
    await navigator.clipboard.writeText(result.summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedPRData = prs.find((p) => p.number === selectedPR);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header
        title="AI Summarizer"
        subtitle="Groq LLM translates diffs into plain English"
      />

      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
        {/* Selector Card */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Brain size={16} color="#059669" />
 Riverside            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>
                Summarize Pull Request Diff
              </h2>
              <p style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                Powered by Groq · llama-3.3-70b-versatile
              </p>
            </div>
          </div>

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
                  {loadingPRs ? "Loading PRs…" : "— Choose a PR to summarize —"}
                </option>
                {prs.map((pr) => (
                  <option key={pr.number} value={pr.number}>
                    #{pr.number} · {pr.title.slice(0, 65)}
                    {pr.title.length > 65 ? "…" : ""}
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
              disabled={!selectedPR || loading}
              onClick={summarize}
              style={{ minWidth: 140 }}
            >
              <Sparkles size={15} />
              {loading ? "Summarizing…" : "Summarize"}
            </button>
          </div>

          {selectedPRData && (
            <div
              style={{
                marginTop: 24,
                padding: "16px 20px",
                background: "rgba(16, 185, 129, 0.06)",
                border: "1px solid rgba(16, 185, 129, 0.12)",
                borderRadius: 12,
                marginBottom: 24,
                fontSize: 12,
              }}
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  <strong style={{ color: "#34d399" }}>Author:</strong> @{selectedPRData.user.login}
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  <strong style={{ color: "#34d399" }}>+{selectedPRData.additions}</strong> additions
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  <strong style={{ color: "#34d399" }}>-{selectedPRData.deletions}</strong> deletions
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  <strong style={{ color: "#34d399" }}>{selectedPRData.changed_files}</strong> files
                </div>
              </div>
            </div>
          )}
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

        {loading && (
          <div
            style={{
              padding: "40px 24px",
              textAlign: "center",
              borderRadius: 14,
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "2px solid rgba(16, 185, 129, 0.3)",
                borderTop: "2px solid #059669",
                margin: "0 auto 16px",
                animation: "spin 1s linear infinite",
              }}
            />
            <div style={{ fontSize: 14, color: "#059669", fontWeight: 600 }}>
              Analyzing diff with Groq LLM…
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>
              This usually takes 1–3 seconds
            </div>
          </div>
        )}

        {result && (
          <div
            className="card animate-fade-in"
            style={{
              background: "rgba(17,24,39,0.8)",
              borderColor: "rgba(139,92,246,0.25)",
            }}
          >
            {/* Summary header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    gap: 6,
                    alignItems: "center",
                    padding: "4px 12px",
                    borderRadius: 999,
                    background: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    marginBottom: 10,
                  }}
                >
                  <Sparkles size={11} color="#059669" />
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", letterSpacing: "0.08em" }}>
                    AI SUMMARY · {result.model}
                  </span>
                  {result.tokensUsed && (
                    <span style={{ fontSize: 10, color: "#475569" }}>
                      · {result.tokensUsed.toLocaleString()} tokens
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>
                  PR #{result.prNumber}: {result.title}
                </h3>
              </div>

              <button
                className="btn-ghost"
                style={{ padding: "6px 12px", fontSize: 12 }}
                onClick={copyToClipboard}
              >
                {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(139,92,246,0.15)", marginBottom: 20 }} />

            {/* Summary content */}
            <div
              style={{
                padding: "4px 0",
              }}
            >
              <MarkdownRenderer text={result.summary} />
            </div>
          </div>
        )}

        {!result && !loading && !error && (
          <div style={{ textAlign: "center", padding: "80px 24px", color: "#334155" }}>
            <Brain size={48} color="#1e293b" style={{ margin: "0 auto 16px" }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>
              Pick a PR and click Summarize
            </div>
            <div style={{ fontSize: 13, color: "#334155", marginTop: 8, maxWidth: 400, margin: "8px auto 0" }}>
              CommitGuard fetches the raw diff and sends it to the Groq LLM (Llama 3.3 70B)
              to produce a plain-English summary anyone can understand.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
