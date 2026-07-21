import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [supplier] = await db.update(suppliers).set({
    name: body.name,
    phone: body.phone || null,
    address: body.address || null,
    email: body.email || null,
    notes: body.notes || null,
    updatedAt: new Date(),
  }).where(eq(suppliers.id, parseInt(id))).returning();

  await logActivity(session.userId, "update", `ویرایش تأمین‌کننده: ${body.name}`, "supplier", supplier.id);
  return NextResponse.json({ supplier });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(suppliers).where(eq(suppliers.id, parseInt(id)));
  await logActivity(session.userId, "delete", `حذف تأمین‌کننده با شناسه ${id}`, "supplier", parseInt(id));
  return NextResponse.json({ success: true });
}
