"use client";

import { useEffect, useState } from "react";
import Header from "@/app/components/Header";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Label,
} from "recharts";
import { getQuadrant } from "@/lib/impact";
import type { MatrixPoint } from "@/types";
import { Info, AlertCircle } from "lucide-react";

const QUADRANT_COLORS: Record<string, string> = {
  "High Effort / High Impact": "#ef4444",
  "Low Effort / High Impact": "#10b981",
  "High Effort / Low Impact": "#f59e0b",
  "Low Effort / Low Impact": "#6366f1",
};

const QUADRANT_LABELS = [
  { x: 75, y: 75, text: "High Effort / High Impact", color: "#ef4444", sub: "Ship carefully" },
  { x: 25, y: 75, text: "Low Effort / High Impact", color: "#10b981", sub: "Quick wins" },
  { x: 75, y: 25, text: "High Effort / Low Impact", color: "#f59e0b", sub: "Evaluate scope" },
  { x: 25, y: 25, text: "Low Effort / Low Impact", color: "#6366f1", sub: "Routine changes" },
];

interface CustomDotProps {
  cx?: number;
  cy?: number;
  payload?: MatrixPoint;
}

function CustomDot({ cx = 0, cy = 0, payload }: CustomDotProps) {
  const quadrant = getQuadrant(payload?.effort ?? 0, payload?.impact ?? 0);
  const color = QUADRANT_COLORS[quadrant] ?? "#6366f1";
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.85} stroke="rgba(0,0,0,0.4)" strokeWidth={1} />
    </g>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: MatrixPoint }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const quadrant = getQuadrant(d.effort, d.impact);
  const color = QUADRANT_COLORS[quadrant];
  return (
    <div
      style={{
        background: "rgba(11,15,30,0.97)",
        border: `1px solid ${color}40`,
        borderRadius: 10,
        padding: "12px 16px",
        maxWidth: 260,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 16px ${color}30`,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, color: "#f1f5f9", marginBottom: 6, lineHeight: 1.4 }}>
        PR #{d.prNumber}: {d.title}
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 10, color: "#475569" }}>EFFORT</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#f59e0b" }}>{d.effort}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#475569" }}>IMPACT</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>{d.impact}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#475569" }}>LOC</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#06b6d4" }}>
            {(d.additions + d.deletions).toLocaleString()}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color, marginBottom: 4 }}>
        {quadrant}
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>
        {d.files.length} file(s) · by {d.user}
      </div>
    </div>
  );
}

const LEGEND = [
  { color: "#ef4444", label: "High Effort / High Impact" },
  { color: "#10b981", label: "Low Effort / High Impact" },
  { color: "#f59e0b", label: "High Effort / Low Impact" },
  { color: "#6366f1", label: "Low Effort / Low Impact" },
];

export default function MatrixPage() {
  const [data, setData] = useState<MatrixPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<MatrixPoint | null>(null);

  useEffect(() => {
    fetch("/api/matrix")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header
        title="Effort-to-Impact Matrix"
        subtitle="Visualize PR complexity vs risk quadrant"
      />

      <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
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
            <AlertCircle size={14} color="#ef4444" />
            {error}
          </div>
        )}

        {/* Info Banner */}
        <div
          style={{
            display: "flex",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(99,102,241,0.07)",
            border: "1px solid rgba(99,102,241,0.15)",
            marginBottom: 20,
            alignItems: "flex-start",
          }}
        >
          <Info size={14} color="#6366f1" style={{ marginTop: 2, flexShrink: 0 }} />
          <p style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
            <strong style={{ color: "#818cf8" }}>Effort</strong> = logarithmic scale of lines changed (additions + deletions).{" "}
            <strong style={{ color: "#818cf8" }}>Impact</strong> = weighted score based on critical file paths
            (auth, security, payments = high; tests, docs = low).
          </p>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
          {LEGEND.map((l) => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color }} />
              <span style={{ fontSize: 11, color: "#64748b" }}>{l.label}</span>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div
          className="card"
          style={{ padding: "24px", height: 500 }}
        >
          {loading ? (
            <div className="skeleton" style={{ width: "100%", height: "100%", borderRadius: 8 }} />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 40, left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                <XAxis
                  type="number"
                  dataKey="effort"
                  domain={[0, 100]}
                  tick={{ fill: "#475569", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(99,102,241,0.2)" }}
                  tickLine={false}
                >
                  <Label
                    value="Effort (LOC-based)"
                    position="insideBottom"
                    offset={-20}
                    fill="#475569"
                    fontSize={12}
                  />
                </XAxis>
                <YAxis
                  type="number"
                  dataKey="impact"
                  domain={[0, 100]}
                  tick={{ fill: "#475569", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(99,102,241,0.2)" }}
                  tickLine={false}
                >
                  <Label
                    value="Impact (File Path)"
                    angle={-90}
                    position="insideLeft"
                    offset={20}
                    fill="#475569"
                    fontSize={12}
                  />
                </YAxis>
                <Tooltip content={<CustomTooltip />} cursor={false} />
                <ReferenceLine x={50} stroke="rgba(99,102,241,0.2)" strokeDasharray="5 5" />
                <ReferenceLine y={50} stroke="rgba(99,102,241,0.2)" strokeDasharray="5 5" />
                <Scatter
                  data={data}
                  shape={(props: CustomDotProps) => <CustomDot {...props} />}
                />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Data Table */}
        {!loading && data.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 20 }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)" }}>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "#f1f5f9" }}>
                PR Matrix Data ({data.length} PRs)
              </h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {["PR #", "Title", "Effort", "Impact", "LOC ±", "Quadrant"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#334155",
                          letterSpacing: "0.07em",
                          textTransform: "uppercase",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data
                    .sort((a, b) => b.impact + b.effort - (a.impact + a.effort))
                    .map((row) => {
                      const q = getQuadrant(row.effort, row.impact);
                      const color = QUADRANT_COLORS[q];
                      return (
                        <tr
                          key={row.prNumber}
                          style={{ borderBottom: "1px solid rgba(99,102,241,0.05)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99,102,241,0.04)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          <td style={{ padding: "10px 16px", color: "#475569", fontFamily: "JetBrains Mono, monospace" }}>
                            #{row.prNumber}
                          </td>
                          <td
                            style={{
                              padding: "10px 16px",
                              color: "#e2e8f0",
                              maxWidth: 300,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {row.title}
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "2px 8px",
                                borderRadius: 4,
                                background: "rgba(245,158,11,0.1)",
                                color: "#f59e0b",
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {row.effort}
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <div
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                padding: "2px 8px",
                                borderRadius: 4,
                                background: `${color}18`,
                                color,
                                fontSize: 11,
                                fontWeight: 600,
                              }}
                            >
                              {row.impact}
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px", fontFamily: "JetBrains Mono, monospace", color: "#64748b", fontSize: 11 }}>
                            +{row.additions} / -{row.deletions}
                          </td>
                          <td style={{ padding: "10px 16px" }}>
                            <span style={{ fontSize: 11, color, fontWeight: 600 }}>{q}</span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
