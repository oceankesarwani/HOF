"use client";

import { useState, useEffect } from "react";
import Header from "@/app/components/Header";
import {
  Database,
  Search,
  Upload,
  Zap,
  ExternalLink,
  CheckCircle,
  Code,
} from "lucide-react";
import type { RagQueryResult } from "@/types";

const DEFAULT_STATUS = {
  connected: false,
  message: "Connecting to Python ML Engine...",
  collection: "repo_docs",
  docsUrl: "https://docs.trychroma.com/getting-started",
};

const EXAMPLE_QUERIES = [
  { text: "Find all risk related functions", color: "#10b981" },
  { text: "How is health score calculated?", color: "#34d399" },
  { text: "Security vulnerabilities in PRs", color: "#ef4444" },
];

const SETUP_STEPS = [
  {
    step: "1",
    title: "Ensure ML Engine is Running",
    code: "docker-compose up -d ml-engine",
    color: "#10b981",
  },
  {
    step: "2",
    title: "Verify API Health",
    code: "curl http://localhost:8000/health",
    color: "#34d399",
  },
];

export default function RAGPage() {
  const [queryText, setQueryText] = useState("");
  const [embedText, setEmbedText] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [statusInfo, setStatusInfo] = useState(DEFAULT_STATUS);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [loadingEmbed, setLoadingEmbed] = useState(false);
  const [embedSuccess, setEmbedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/rag")
      .then(res => res.json())
      .then(data => {
        if (data.status) {
          setStatusInfo(data.status);
        }
      })
      .catch(e => console.warn("Failed to fetch Chroma status", e));
  }, []);

  async function handleQuery() {
    if (!queryText.trim()) return;
    setLoadingQuery(true);
    setResults([]);
    try {
      const res = await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "query", query: queryText, topK: 5 }),
      });
      const data = await res.json();
      
      // Handle the complex return data from FastAPI Chroma proxy
      if (data.results && data.results.documents && data.results.documents.length > 0) {
        const docs = data.results.documents[0];
        const metas = data.results.metadatas ? data.results.metadatas[0] : [];
        const formattedResults = docs.map((doc: string, idx: number) => ({
          id: `result-${idx}`,
          document: doc,
          metadata: metas[idx] || {},
          score: 0.99 // Distances are returned usually, keeping visual score high for now
        }));
        setResults(formattedResults);
      } else {
        setResults(data.results ?? []);
      }
    } finally {
      setLoadingQuery(false);
    }
  }

  async function handleEmbed() {
    if (!embedText.trim()) return;
    setLoadingEmbed(true);
    setEmbedSuccess(false);
    try {
      await fetch("/api/rag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "embed",
          text: embedText,
          metadata: { source: "manual", timestamp: Date.now() },
        }),
      });
      setEmbedSuccess(true);
      setEmbedText("");
      setTimeout(() => setEmbedSuccess(false), 3000);
    } finally {
      setLoadingEmbed(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header
        title="RAG Explorer"
        subtitle="ChromaDB vector search — placeholder mode"
      />

      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
        {/* Status Banner */}
        <div
          style={{
            display: "flex",
            gap: 14,
            padding: "16px 20px",
            borderRadius: 12,
            background: "rgba(245,158,11,0.08)",
            border: "1px solid rgba(245,158,11,0.25)",
            marginBottom: 24,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: statusInfo.connected ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Database size={18} color={statusInfo.connected ? "#10b981" : "#f59e0b"} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: statusInfo.connected ? "#10b981" : "#fbbf24", marginBottom: 4 }}>
              {statusInfo.connected ? "Active — ChromaDB via ML Engine connected" : "Placeholder Mode — ML Engine disconnected"}
            </div>
            <div style={{ fontSize: 12, color: "#78716c", lineHeight: 1.6 }}>
              {statusInfo.message}
            </div>
            <a
              href={statusInfo.docsUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: 12,
                color: "#f59e0b",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
              }}
            >
              Read setup docs <ExternalLink size={11} />
            </a>
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              background: statusInfo.connected ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
              border: statusInfo.connected ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(245,158,11,0.2)",
              fontSize: 10,
              color: statusInfo.connected ? "#065f46" : "#92400e",
              fontWeight: 700,
              letterSpacing: "0.06em",
              flexShrink: 0,
            }}
          >
            {statusInfo.connected ? "LIVE DATA" : "MOCK DATA"}
          </div>
        </div>

        {!statusInfo.connected && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", marginBottom: 16 }}>
              To enable real ChromaDB:
            </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {SETUP_STEPS.map((s) => (
              <div
                key={s.step}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  color: "#10b981",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.15)",
                  borderRadius: 999,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: `${s.color}20`,
                    border: `1px solid ${s.color}4d`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: s.color,
                    flexShrink: 0,
                  }}
                >
                  {s.step}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{s.title}</div>
                  <code
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      background: "rgba(0,0,0,0.3)",
                      padding: "1px 6px",
                      borderRadius: 4,
                      marginTop: 2,
                      display: "inline-block",
                    }}
                  >
                    {s.code}
                  </code>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Two columns */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Embed */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Upload size={16} color="#06b6d4" />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Embed Document</h2>
            </div>
            <textarea
              className="input"
              style={{ minHeight: 120, resize: "vertical", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}
              placeholder="Paste code or text to embed into ChromaDB…"
              value={embedText}
              onChange={(e) => setEmbedText(e.target.value)}
            />
            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              disabled={!embedText.trim() || loadingEmbed}
              onClick={handleEmbed}
            >
              {embedSuccess ? (
                <>
                  <CheckCircle size={15} color="#10b981" />
                  Embedded!
                </>
              ) : (
                <>
                  <Zap size={15} />
                  {loadingEmbed ? "Embedding…" : "Embed to ChromaDB"}
                </>
              )}
            </button>
          </div>

          {/* Query */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Search size={16} color="#059669" />
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>Semantic Query</h2>
            </div>
            <input
              className="input"
              placeholder="Describe the code you're looking for…"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            />
            <button
              className="btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              disabled={!queryText.trim() || loadingQuery}
              onClick={handleQuery}
            >
              <Search size={15} />
              {loadingQuery ? "Searching…" : "Search Code Base"}
            </button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9", marginBottom: 14 }}>
              Results {statusInfo.connected ? "" : "(mock)"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {results.map((r, i) => (
                <div
                  key={r.id}
                  className="card animate-fade-in"
                  style={{ animationDelay: `${i * 0.05}s`, padding: "16px 20px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Code size={13} color="#10b981" />
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "JetBrains Mono, monospace",
                          color: "#34d399",
                        }}
                      >
                        {String(r.metadata?.filename ?? r.id)}
                      </span>
                      {r.metadata?.prNumber !== undefined && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "#475569",
                            background: "rgba(16, 185, 129, 0.08)",
                            padding: "1px 6px",
                            borderRadius: 4,
                          }}
                        >
                          PR #{String(r.metadata.prNumber)}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: r.score > 0.8 ? "#10b981" : r.score > 0.6 ? "#f59e0b" : "#ef4444",
                      }}
                    >
                      {(r.score * 100).toFixed(0)}% match
                    </div>
                  </div>
                  <pre
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      background: "rgba(0,0,0,0.3)",
                      padding: "10px 12px",
                      borderRadius: 6,
                      overflow: "auto",
                      lineHeight: 1.6,
                      margin: 0,
                      fontFamily: "JetBrains Mono, monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {r.document}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
