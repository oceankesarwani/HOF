"use client";

import { useState, useEffect } from "react";
import { RefreshCw, ExternalLink } from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || "—";
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "—";
  const [time, setTime] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      window.location.reload();
    }, 600);
  }

  return (
    <header
      style={{
        height: "var(--header-height)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 28px",
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(11, 15, 30, 0.8)",
        backdropFilter: "blur(20px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
      }}
    >
      {/* ── Left: Title ── */}
      <div>
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#f1f5f9",
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: 12, color: "#475569", marginTop: 3 }}>{subtitle}</p>
        )}
      </div>

      {/* ── Right: Status + Actions ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Repo badge */}
        <a
          href={`https://github.com/${owner}/${repo}`}
          target="_blank"
          rel="noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            borderRadius: 6,
            textDecoration: "none",
            transition: "all 0.2s",
          }}
        >
          <div className="dot-online" />
          <span
            style={{
              fontSize: 12,
              color: "#34d399",
              fontFamily: "JetBrains Mono, monospace",
              fontWeight: 500,
            }}
          >
            {owner}/{repo}
          </span>
          <ExternalLink size={11} color="#10b981" />
        </a>

        {/* Clock */}
        <div
          style={{
            padding: "5px 12px",
            borderRadius: 6,
            background: "rgba(17,24,39,0.8)",
            border: "1px solid var(--border-subtle)",
            fontSize: 11,
            color: "#334155",
            fontFamily: "JetBrains Mono, monospace",
          }}
        >
          {time}
        </div>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          className="btn-ghost"
          style={{ padding: "6px 10px", gap: 0 }}
          aria-label="Refresh page"
          title="Refresh"
        >
          <RefreshCw
            size={14}
            style={{
              transition: "transform 0.6s",
              transform: refreshing ? "rotate(360deg)" : "rotate(0deg)",
            }}
          />
        </button>
      </div>
    </header>
  );
}
