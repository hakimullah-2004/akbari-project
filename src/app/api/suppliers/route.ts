import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { like, or, desc } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";

  const result = await db
    .select()
    .from(suppliers)
    .where(search ? or(like(suppliers.name, `%${search}%`), like(suppliers.phone || "", `%${search}%`)) : undefined)
    .orderBy(desc(suppliers.createdAt));

  return NextResponse.json({ suppliers: result });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const [supplier] = await db.insert(suppliers).values({
    name: body.name,
    phone: body.phone || null,
    address: body.address || null,
    email: body.email || null,
    notes: body.notes || null,
  }).returning();

  await logActivity(session.userId, "create", `ثبت تأمین‌کننده جدید: ${body.name}`, "supplier", supplier.id);
  return NextResponse.json({ supplier });
}
