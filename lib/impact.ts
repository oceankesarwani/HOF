import type { ImpactLevel } from "@/types";

interface ImpactRule {
  pattern: RegExp;
  score: number;
  level: ImpactLevel;
  label: string;
}

const IMPACT_RULES: ImpactRule[] = [
  // Specific File Types (Low Impact by Default)
  {
    pattern: /\.(css|scss|sass|less|styl|styled)$/i,
    score: 15,
    level: "low",
    label: "Styles",
  },
  {
    pattern: /\.(docs|documentation|readme|changelog|contributing|md|mdx|txt|rst)$/i,
    score: 10,
    level: "low",
    label: "Docs",
  },
  {
    pattern: /\.(png|jpg|jpeg|svg|gif|ico|webp|woff|ttf|eot)$/i,
    score: 5,
    level: "low",
    label: "Assets",
  },
  {
    pattern: /\/(tests|test|spec|__tests__|__mocks__|fixtures)/i,
    score: 20,
    level: "low",
    label: "Tests",
  },

  // Critical — authentication, authorization, secrets
  {
    pattern: /\/(auth|authentication|oauth|login|logout|session|token|jwt|password|credentials|secret)/i,
    score: 100,
    level: "critical",
    label: "Authentication",
  },
  {
    pattern: /\/(security|crypto|encryption|ssl|tls|cert)/i,
    score: 95,
    level: "critical",
    label: "Security",
  },
  // High — core business logic, payments, data
  {
    pattern: /\/(payment|billing|checkout|stripe|subscription|invoice)/i,
    score: 90,
    level: "high",
    label: "Payments",
  },
  {
    pattern: /\/(database|db|migration|schema|model|prisma|orm)/i,
    score: 85,
    level: "high",
    label: "Database",
  },
  {
    pattern: /\/(api|routes|endpoints|controllers)/i,
    score: 80,
    level: "high",
    label: "API Layer",
  },
  {
    pattern: /\/(config|configuration|env|settings|constants)/i,
    score: 75,
    level: "high",
    label: "Config",
  },
  // Medium — features, components
  {
    pattern: /\/(components|hooks|contexts|providers|store|state)/i,
    score: 55,
    level: "medium",
    label: "Components",
  },
  {
    pattern: /\/(services|utils|helpers|lib|core)/i,
    score: 50,
    level: "medium",
    label: "Services",
  },
  {
    pattern: /\/(pages|views|screens)/i,
    score: 45,
    level: "medium",
    label: "Pages",
  },
];

const DEFAULT_SCORE = 40; // fallback for unmatched paths

export function getFileImpact(filename: string): {
  score: number;
  level: ImpactLevel;
  label: string;
} {
  for (const rule of IMPACT_RULES) {
    if (rule.pattern.test(filename)) {
      return { score: rule.score, level: rule.level, label: rule.label };
    }
  }
  return { score: DEFAULT_SCORE, level: "medium", label: "General" };
}

export async function computeImpactAsync(diffText: string, filenames: string[]): Promise<number> {
  const heuristicScore = computeImpact(filenames);
  
  console.log(`[Impact Debug] Heuristic Score for files:`, {
    filenames,
    heuristicScore
  });

  // Category-based caps to prevent false escalations
  // Low: Styles, Docs, Assets, Tests (<= 30)
  // Medium: Components, Services, Pages (<= 75)
  let maxPossibleScore = 100;
  if (heuristicScore <= 20) maxPossibleScore = 30; // Styles/Assets/Docs strictly low
  else if (heuristicScore <= 40) maxPossibleScore = 55; // Minor components
  else if (heuristicScore <= 60) maxPossibleScore = 75; // Standard features

  let finalScore = heuristicScore;

  const ML_ENGINE_URL = process.env.ML_ENGINE_URL || "http://localhost:8000";
  
  if (diffText && diffText.length > 5) {
    try {
      const res = await fetch(`${ML_ENGINE_URL}/api/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diff: diffText })
      });
      if (res.ok) {
        const data = await res.json();
        console.log(`[Impact Debug] ML Engine returned ${data.risk_level} (raw: ${data.raw_score})`);
        
        // Only allow AI to push score higher if we're not in a 'Low Impact' category
        if (data.risk_level === "High" && heuristicScore > 20) {
            finalScore = Math.min(maxPossibleScore, finalScore + 40);
        } else if (data.risk_level === "Low") {
            finalScore = Math.max(10, finalScore - 10);
        }
      }
    } catch (e) {
      console.warn("ML classification failed, falling back to heuristics");
    }
  }

  // Final clamp based on category
  return Math.min(maxPossibleScore, finalScore);
}

export function computeImpact(filenames: string[]): number {
  if (filenames.length === 0) return 0;
  const detailedScores = filenames.map((f) => ({
    file: f,
    score: getFileImpact(f).score,
    label: getFileImpact(f).label
  }));
  
  const scores = detailedScores.map(d => d.score);
  const max = Math.max(...scores);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const final = Math.round(max * 0.6 + avg * 0.4);

  console.log(`[Impact Debug] Detail:`, { detailedScores, final });
  return final;
}

export function computeEffort(additions: number, deletions: number): number {
  const totalLoc = additions + deletions;
  // Logarithmic scale: 0 LOC = 0, 10 = ~25, 100 = ~50, 1000 = ~75, 5000 = ~100
  if (totalLoc === 0) return 0;
  const raw = Math.log10(totalLoc + 1) / Math.log10(5001) * 100;
  return Math.min(100, Math.round(raw));
}

export function getQuadrant(effort: number, impact: number): string {
  const highEffort = effort >= 50;
  const highImpact = impact >= 50;
  if (highEffort && highImpact) return "High Effort / High Impact";
  if (!highEffort && highImpact) return "Low Effort / High Impact";
  if (highEffort && !highImpact) return "High Effort / Low Impact";
  return "Low Effort / Low Impact";
}
