import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/session";

export const dynamic = "force-dynamic";

// PATCH /api/alerts/[id] — toggle enabled
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return Response.json({ error: "No session" }, { status: 401 });

  const rule = await prisma.alertRule.findFirst({ where: { id, userId: sessionId } });
  if (!rule) return Response.json({ error: "Rule not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const enabled = typeof body.enabled === "boolean" ? body.enabled : !rule.enabled;

  const updated = await prisma.alertRule.update({ where: { id }, data: { enabled } });
  return Response.json({ rule: updated });
}

// DELETE /api/alerts/[id] — remove a rule
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return Response.json({ error: "No session" }, { status: 401 });

  const rule = await prisma.alertRule.findFirst({ where: { id, userId: sessionId } });
  if (!rule) return Response.json({ error: "Rule not found" }, { status: 404 });

  await prisma.alertRule.delete({ where: { id } });
  return Response.json({ success: true });
}
