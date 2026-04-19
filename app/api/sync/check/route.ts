import { NextRequest, NextResponse } from "next/server";
import { checkDocSync } from "@/lib/sync";

/**
 * Trigger documentation sync check for a PR.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prNumber } = body;

    if (!prNumber) {
      return NextResponse.json({ error: "Missing prNumber" }, { status: 400 });
    }

    const result = await checkDocSync(prNumber);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
