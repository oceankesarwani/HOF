import { NextRequest } from "next/server";
import { listPRs, getPRStats } from "@/lib/github";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = (searchParams.get("state") || "all") as "open" | "closed" | "all";

    const prs = await listPRs(state);

    // Fetch detailed stats for all PRs in parallel to get additions/deletions
    const results = await Promise.all(
      prs.map(async (pr) => {
        let stats = { additions: 0, deletions: 0 };
        try {
          stats = await getPRStats(pr.number);
        } catch (e) {
          console.warn(`Failed to fetch stats for PR #${pr.number}`);
        }

        return {
          id: pr.id,
          number: pr.number,
          title: pr.title,
          state: pr.merged_at ? "merged" : pr.state,
          user: {
            login: pr.user?.login ?? "unknown",
            avatar_url: pr.user?.avatar_url ?? "",
            html_url: pr.user?.html_url ?? "",
          },
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          merged_at: pr.merged_at ?? null,
          closed_at: pr.closed_at ?? null,
          html_url: pr.html_url,
          body: pr.body ?? null,
          draft: pr.draft ?? false,
          labels: pr.labels.map((l) => ({
            name: l.name ?? "",
            color: l.color ?? "808080",
          })),
          additions: stats.additions ?? 0,
          deletions: stats.deletions ?? 0,
          changed_files: (pr as any).changed_files ?? 0,
          base: { ref: pr.base.ref },
          head: { ref: pr.head.ref, sha: pr.head.sha },
        };
      })
    );

    return Response.json(results);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
