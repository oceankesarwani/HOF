import { NextRequest, NextResponse } from "next/server";
import { getPR, getPRDiff } from "@/lib/github";
import { detectAIGeneratedPR } from "@/lib/groq";
import { queryDocuments } from "@/lib/chroma";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Perform AI Generation Detection on a PR.
 * Checks for hallucinations against the codebase and linguistic patterns.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prNumber } = body;

    if (!prNumber) {
      return NextResponse.json({ error: "Missing prNumber" }, { status: 400 });
    }

    // 1. Fetch PR details and Diff
    const [pr, diff] = await Promise.all([
      getPR(prNumber),
      getPRDiff(prNumber)
    ]);

    // 2. Extract potential symbols from the DIFF to verify
    const diffSymbolsMatch = Array.from(diff.matchAll(/(?:\.\s+|function\s+|def\s+|class\s+)([a-zA-Z0-9_$]+)\s*\(/g)).map(m => m[1]);
    const symbolsToVerify = Array.from(new Set(diffSymbolsMatch)).slice(0, 30);

    // 3. Query ChromaDB for these symbols - specifically looking for code_symbol type
    // and fetch author expertise
    const [history, ...symbolResults] = await Promise.all([
        prisma.expertHistory.findMany({ where: { login: pr.user.login } }),
        ...symbolsToVerify.map(sym => queryDocuments(sym, 1, { type: "code_symbol" }))
    ]);

    const existingSymbols: string[] = [];
    symbolResults.forEach((matches, idx) => {
        const sym = symbolsToVerify[idx];
        if (matches && matches.documents && matches.documents[0] && matches.documents[0].length > 0) {
            // Safe access to ChromDB response structure
            const doc = matches.documents[0][0]; 
            
            // Exact case-insensitive match check
            if (doc && typeof doc === "string" && doc.toLowerCase() === sym.toLowerCase()) {
                existingSymbols.push(sym);
            }
        }
    });

    // 4. Perform LLM analysis using the extra context
    const expertContext = history.length > 0 
        ? history.map(h => `${h.domain}: ${h.commits} commits`).join(", ")
        : "No previous history in this repository.";

    const result = await detectAIGeneratedPR(
      { title: pr.title, body: pr.body ?? "" },
      diff,
      existingSymbols,
      expertContext
    );

    // 5. Persist the analysis
    const detection = await prisma.aIDetection.upsert({
      where: { prNumber },
      update: {
        score: result.score,
        confidence: result.confidence,
        reasoning: JSON.stringify(result.reasoning),
        isBot: result.isBot,
        recommendedAction: result.recommendedAction,
      },
      create: {
        prNumber,
        score: result.score,
        confidence: result.confidence,
        reasoning: JSON.stringify(result.reasoning),
        isBot: result.isBot,
        recommendedAction: result.recommendedAction,
      }
    });

    return NextResponse.json(detection);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET - Retrieve latest detection results for the UI
 */
export async function GET() {
    const results = await prisma.aIDetection.findMany({
        orderBy: { createdAt: "desc" },
        take: 50
    });
    return NextResponse.json(results);
}
