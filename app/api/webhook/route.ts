import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payload);
  const digest = `sha256=${hmac.digest("hex")}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    return Response.json(
      { error: "GITHUB_WEBHOOK_SECRET not configured" },
      { status: 500 }
    );
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const event = request.headers.get("x-github-event") ?? "unknown";
  const deliveryId = request.headers.get("x-github-delivery") ?? "none";

  // Verify HMAC signature
  if (!verifySignature(rawBody, signature, secret)) {
    console.warn(`[Webhook] Invalid signature for delivery ${deliveryId}`);
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  console.log(`[Webhook] Received event: ${event} | Delivery: ${deliveryId}`);

  // Handle pull_request events
  if (event === "pull_request") {
    const action = String(payload.action ?? "unknown");
    const pr = payload.pull_request as Record<string, unknown>;
    const prNumber = Number((pr?.number as number) ?? 0);
    const prTitle = String(pr?.title ?? "");
    const senderLogin = String(
      (payload.sender as Record<string, unknown>)?.login ?? "unknown"
    );
    const repoName = String(
      ((payload.repository as Record<string, unknown>)?.full_name as string) ?? ""
    );

    try {
      await prisma.webhookEvent.create({
        data: {
          event,
          action,
          prNumber,
          title: prTitle,
          sender: senderLogin,
          repo: repoName,
        },
      });
      console.log(`[Webhook] PR #${prNumber} (${action}) by ${senderLogin} in ${repoName}`);
    } catch (dbError) {
      console.error("[Webhook] Database error saving event:", dbError);
      // We continue even if DB save fails to at least try triggering tasks if possible,
      // or to return a success to GitHub to avoid webhook retries.
    }

    // Trigger Knowledge Bridge background tasks async
    if (action === "opened" || action === "synchronize") {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      
      // 1. Summarization
      fetch(`${baseUrl}/api/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prNumber }),
      }).catch(e => console.warn("Failed to trigger summarization", e));

      // 2. Documentation Sync Check
      fetch(`${baseUrl}/api/sync/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prNumber }),
      }).catch(e => console.warn("Failed to trigger doc-sync check", e));
    }

    return Response.json({
      received: true,
      event,
      action,
      pr_number: prNumber,
      delivery_id: deliveryId,
    });
  }

  // Acknowledge other events
  return Response.json({ received: true, event, action: "ignored" });
}

// GET — return recent event log (for dashboard display)
export async function GET() {
  try {
    const events = await prisma.webhookEvent.findMany({
      orderBy: { receivedAt: "desc" },
      take: 100,
    });
    
    // Format to match expected frontend interface if needed
    const formattedEvents = events.map((e: any) => ({
      action: e.action,
      pr_number: e.prNumber,
      title: e.title,
      sender: e.sender,
      repo: e.repo,
      received_at: e.receivedAt.toISOString(),
    }));

    return Response.json(formattedEvents);
  } catch (error) {
    console.error("[Webhook GET] Error fetching events:", error);
    return Response.json([], { status: 500 });
  }
}
