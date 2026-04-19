import { NextResponse } from "next/server";
import { indexProjectDocs } from "@/lib/docs";
import { indexCodeSymbols } from "@/lib/indexer";

export const dynamic = "force-dynamic";

/**
 * Trigger documentation and source code re-indexing manually via API.
 */
export async function POST() {
  try {
    const [docs, code] = await Promise.all([
      indexProjectDocs(process.cwd()),
      indexCodeSymbols(process.cwd())
    ]);

    return NextResponse.json({
      success: true,
      message: `Successfully indexed ${docs.indexedFiles} documentation files and ${code.totalSymbols} code symbols.`,
      details: { docs, code }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
