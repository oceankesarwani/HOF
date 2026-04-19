import Link from "next/link";
import {
  GitPullRequest,
  Shield,
  Zap,
  Brain,
  Network,
  GitMerge,
  ArrowRight,
  GitFork,
  Activity,
} from "lucide-react";

const features = [
  {
    icon: GitPullRequest,
    title: "PR Dashboard",
    description:
      "Real-time GitHub PR monitoring with status filters, search, and detailed file breakdowns.",
    color: "#10b981",
    glow: "rgba(16,185,129,0.3)",
  },
  {
    icon: Activity,
    title: "Effort-to-Impact Matrix",
    description:
      "Visualize every PR on a 2D quadrant chart — effort by lines changed, impact by file criticality.",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.3)",
  },
  {
    icon: Network,
    title: "Contributor Matchmaker",
    description:
      "Automatically identify the top expert for each modified file using git history analysis.",
    color: "#10b981",
    glow: "rgba(16,185,129,0.3)",
  },
  {
    icon: Brain,
    title: "AI Summarizer",
    description:
      "Groq LLM translates complex diffs into plain English summaries for any stakeholder.",
    color: "#34d399",
    glow: "rgba(52,211,153,0.3)",
  },
  {
    icon: Shield,
    title: "Webhook Receiver",
    description:
      "Live /api/webhook endpoint that validates HMAC signatures and logs all PR events.",
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.3)",
  },
  {
    icon: Zap,
    title: "RAG-Ready",
    description:
      "ChromaDB placeholder service pre-wired for semantic code search and retrieval-augmented generation.",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.3)",
  },
];

const stats = [
  { value: "< 1s", label: "AI Summary Time" },
  { value: "6", label: "Core Features" },
  { value: "100%", label: "TypeScript" },
  { value: "Free", label: "Groq LLM Tier" },
];

export default function LandingPage() {
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER || "your-org";
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO || "your-repo";

  return (
    <main
      style={{ 
        minHeight: "100vh", 
        position: "relative",
        backgroundImage: "url('/space-octocat.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}
    >
      {/* ── Dark Immersive Overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(4,7,18,0.4) 0%, rgba(4,7,18,0.9) 100%)",
          backdropFilter: "blur(1px)",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* ── Nav ── */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 48px",
            background: "rgba(4,7,18,0.5)",
            borderBottom: "1px solid rgba(16,185,129,0.2)",
            boxShadow: "0 4px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "linear-gradient(135deg, #10b981, #059669)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(16,185,129,0.4)",
              }}
            >
              <Shield size={18} color="white" />
            </div>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#f1f5f9",
              }}
            >
              Commit<span style={{ color: "#34d399" }}>Guard</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div className="dot-online" />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                {owner}/{repo}
              </span>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 8,
                border: "1px solid rgba(16,185,129,0.25)",
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <GitFork size={14} />
              GitHub
            </a>
            <Link href="/dashboard" className="btn-primary" style={{ padding: "8px 20px", fontSize: 13 }}>
              Open Dashboard
              <ArrowRight size={14} />
            </Link>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section
          style={{
            textAlign: "center",
            padding: "120px 24px 80px",
            maxWidth: 860,
            margin: "0 auto",
          }}
          className="animate-fade-in"
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.3)",
              marginBottom: 32,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: 12, color: "#34d399", fontWeight: 600, letterSpacing: "0.08em" }}>
              AI-POWERED PULL REQUEST INTELLIGENCE
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(48px, 8vw, 80px)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.04em",
              marginBottom: 24,
            color: "#f1f5f9",
            textShadow: "0 0 30px rgba(16,185,129,0.4)",
          }}
        >
          Ship code with{" "}
          <span className="gradient-text" style={{ filter: "drop-shadow(0 0 15px rgba(6,182,212,0.5))" }}>confidence.</span>
          </h1>

          <p
            style={{
              fontSize: 20,
              color: "#94a3b8",
              maxWidth: 600,
              margin: "0 auto 48px",
              lineHeight: 1.7,
              fontWeight: 400,
            }}
          >
            CommitGuard analyzes your GitHub PRs with AI, scores risk, identifies the right reviewer, 
            and summarizes complex diffs — all in one dashboard.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/dashboard" className="btn-primary" style={{ fontSize: 15, padding: "14px 32px" }}>
              <GitMerge size={18} />
              Open Dashboard
              <ArrowRight size={16} />
            </Link>
            <a
              href="https://docs.trychroma.com"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost"
              style={{ fontSize: 15, padding: "14px 32px" }}
            >
              <Zap size={16} />
              View RAG Docs
            </a>
          </div>
        </section>

        {/* ── Stats ── */}
        <section
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 0,
            padding: "0 24px 80px",
            flexWrap: "wrap",
          }}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              style={{
                padding: "28px 48px",
                textAlign: "center",
                borderRight: i < stats.length - 1 ? "1px solid rgba(16,185,129,0.15)" : "none",
              }}
            >
              <div
                className="gradient-text"
                style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1 }}
              >
                {stat.value}
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 6, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </section>

        {/* ── Features Grid ── */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 120px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <h2 style={{ fontSize: 40, fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9" }}>
              Everything you need for smarter code review
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 17, marginTop: 16, maxWidth: 520, margin: "12px auto 0" }}>
              Six powerful features that work together to make your PR process faster and safer.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 20,
            }}
          >
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="card glass-hover"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    cursor: "default",
                    background: "rgba(11,15,30,0.4)",
                    backdropFilter: "blur(12px)",
                    borderColor: "rgba(16,185,129,0.2)",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `rgba(${hexToRgb(feature.color)}, 0.15)`,
                      border: `1px solid rgba(${hexToRgb(feature.color)}, 0.3)`,
                      marginBottom: 16,
                      boxShadow: `0 0 20px ${feature.glow}`,
                    }}
                  >
                    <Icon size={22} color={feature.color} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA Banner ── */}
        <section style={{ padding: "0 24px 100px" }}>
          <div
            style={{
              maxWidth: 800,
              margin: "0 auto",
              padding: "60px 48px",
              borderRadius: 24,
              textAlign: "center",
              background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))",
              border: "1px solid rgba(16,185,129,0.3)",
              boxShadow: "0 0 60px rgba(16,185,129,0.15)",
            }}
          >
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", color: "#f1f5f9", marginBottom: 16 }}>
              Ready to guard your commits?
            </h2>
            <p style={{ color: "#94a3b8", fontSize: 16, marginBottom: 32 }}>
              Set your GitHub token in .env.local and open the dashboard.
            </p>
            <Link href="/dashboard" className="btn-primary" style={{ fontSize: 15, padding: "14px 36px" }}>
              <Shield size={18} />
              Launch Dashboard
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer
          style={{
            borderTop: "1px solid rgba(16,185,129,0.1)",
            padding: "24px 48px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, color: "#475569" }}>
            CommitGuard © {new Date().getFullYear()}
          </span>
          <span style={{ fontSize: 12, color: "#334155", fontFamily: "JetBrains Mono, monospace" }}>
            /api/webhook · /api/github/prs · /api/summarize
          </span>
        </footer>
      </div>
    </main>
  );
}

// Helper: convert hex color to rgb string for rgba()
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "16,185,129";
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`;
}
