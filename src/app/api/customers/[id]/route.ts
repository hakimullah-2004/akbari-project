import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, sales } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const [customer] = await db.update(customers).set({
    name: body.name,
    phone: body.phone || null,
    address: body.address || null,
    customerType: body.customerType,
    hasPurchaseHistory: body.hasPurchaseHistory || false,
    hasCreditHistory: body.hasCreditHistory || false,
    notes: body.notes || null,
    updatedAt: new Date(),
  }).where(eq(customers.id, parseInt(id))).returning();

  await logActivity(session.userId, "update", `ویرایش مشتری: ${body.name}`, "customer", customer.id);
  return NextResponse.json({ customer });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "فقط مدیر سیستم می‌تواند حذف کند" }, { status: 401 });

  const { id } = await params;
  await db.delete(customers).where(eq(customers.id, parseInt(id)));
  await logActivity(session.userId, "delete", `حذف مشتری با شناسه ${id}`, "customer", parseInt(id));
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const customerSales = await db.select().from(sales).where(eq(sales.customerId, parseInt(id))).orderBy(desc(sales.saleDate)).limit(20);
  return NextResponse.json({ sales: customerSales });
}
