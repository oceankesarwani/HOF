import { listPRs, getPRFiles, getPRDiff, getPRStats } from "@/lib/github";
import { computeEffort, computeImpactAsync } from "@/lib/impact";
import type { MatrixPoint } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const prs = await listPRs("all");

    const points: MatrixPoint[] = await Promise.all(
      prs.slice(0, 30).map(async (pr) => {
        let filenames: string[] = [];
        let diff = "";
        let stats = { additions: 0, deletions: 0 };
        
        try {
          // Fetch stats (additions/deletions), files, and diff in parallel
          const [files, diffText, prStats] = await Promise.all([
            getPRFiles(pr.number),
            getPRDiff(pr.number),
            getPRStats(pr.number)
          ]);
          filenames = files.map((f) => f.filename);
          diff = diffText;
          stats = prStats;
        } catch (e) {
          console.warn(`Failed to fetch details for PR ${pr.number}`, e);
        }

        const additions = stats.additions ?? 0;
        const deletions = stats.deletions ?? 0;

        return {
          prNumber: pr.number,
          title: pr.title,
          effort: computeEffort(additions, deletions),
          impact: await computeImpactAsync(diff, filenames),
          additions,
          deletions,
          files: filenames,
          state: pr.merged_at ? "merged" : pr.state,
          user: pr.user?.login ?? "unknown",
        };
      })
    );

    return Response.json(points);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
