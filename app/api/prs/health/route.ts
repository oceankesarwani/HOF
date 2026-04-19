import { NextRequest, NextResponse } from "next/server";
import { getPR, getPRDiff, getLinkedIssues, getIssue } from "@/lib/github";
import { analyzePRHealth } from "@/lib/groq";

export const dynamic = "force-dynamic";

/**
 * Endpoint to perform RAG-based PR Health & Relevance analysis.
 * Analyzes the PR against its linked issues and security best practices.
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

    // 2. Identify and fetch linked issues
    const linkedIssueNumbers = getLinkedIssues(pr.body ?? "");
    const issuePromises = linkedIssueNumbers.map(num => getIssue(num));
    const rawIssues = await Promise.all(issuePromises);
    const issues = rawIssues.filter(i => i !== null) as { title: string; body: string }[];

    // 3. Perform LLM analysis
    const healthResult = await analyzePRHealth(
      { title: pr.title, body: pr.body ?? "" },
      issues,
      diff
    );

    return NextResponse.json({
      prNumber,
      title: pr.title,
      linkedIssueCount: issues.length,
      ...healthResult
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
