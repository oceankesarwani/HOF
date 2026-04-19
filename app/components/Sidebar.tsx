"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitPullRequest,
  BarChart3,
  Users,
  Brain,
  Database,
  Shield,
  ChevronRight,
} from "lucide-react";

const navItems = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Overview",
    exact: true,
  },
  {
    href: "/dashboard/prs",
    icon: GitPullRequest,
    label: "Pull Requests",
  },
  {
    href: "/dashboard/matrix",
    icon: BarChart3,
    label: "Effort-Impact Matrix",
  },
  {
    href: "/dashboard/matchmaker",
    icon: Users,
    label: "Matchmaker",
  },
  {
    href: "/dashboard/summarizer",
    icon: Brain,
    label: "AI Summarizer",
  },
  {
    href: "/dashboard/rag",
    icon: Database,
    label: "RAG Explorer",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  function isActive(item: { href: string; exact?: boolean }) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        minWidth: "var(--sidebar-width)",
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        background: "rgba(11, 15, 30, 0.95)",
        borderRight: "1px solid var(--border-subtle)",
        backdropFilter: "blur(20px)",
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      {/* ── Logo ── */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "20px 20px",
          borderBottom: "1px solid var(--border-subtle)",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #10b981, #059669)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 15px rgba(16,185,129,0.4)",
            flexShrink: 0,
          }}
        >
          <Shield size={16} color="white" />
        </div>
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: "-0.03em",
              color: "#f1f5f9",
              lineHeight: 1,
            }}
          >
            Commit<span style={{ color: "#34d399" }}>Guard</span>
          </div>
          <div style={{ fontSize: 10, color: "#475569", marginTop: 2, letterSpacing: "0.05em" }}>
            PR INTELLIGENCE
          </div>
        </div>
      </Link>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#334155", letterSpacing: "0.1em", padding: "8px 10px 4px", textTransform: "uppercase" }}>
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                textDecoration: "none",
                position: "relative",
                background: active
                  ? "rgba(16, 185, 129, 0.15)"
                  : "transparent",
                border: active
                  ? "1px solid rgba(16, 185, 129, 0.25)"
                  : "1px solid transparent",
                marginBottom: 4,
                transition: "all 0.2s",
                boxShadow: active ? "0 4px 15px rgba(0, 0, 0, 0.2)" : "none",
              }}
            >
              <Icon
                size={16}
                color={active ? "#34d399" : "#475569"}
                style={{ flexShrink: 0, transition: "color 0.2s" }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  color: active ? "#a7f3d0" : "#64748b",
                  flex: 1,
                  transition: "color 0.2s",
                }}
              >
                {item.label}
              </span>
              {active && (
                <ChevronRight size={12} color="#10b981" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div
        style={{
          padding: "12px 20px",
          borderTop: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 12px",
            borderRadius: 8,
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          <div className="dot-online" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#10b981" }}>Webhook Active</div>
            <div style={{ fontSize: 10, color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>
              /api/webhook
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
