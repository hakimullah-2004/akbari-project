import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { like, or, sql, desc, and } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const hasDebt = searchParams.get("hasDebt") === "true";

  let conditions = [];

  if (search) {
    conditions.push(or(like(customers.name, `%${search}%`), like(customers.phone || sql`''`, `%${search}%`))!);
  }

  if (type) {
    conditions.push(sql`${customers.customerType} = ${type}`);
  }

  if (hasDebt) {
    conditions.push(sql`${customers.totalDebt} > 0`);
  }

  const result = await db
    .select()
    .from(customers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(customers.createdAt));

  return NextResponse.json({ customers: result });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const [customer] = await db.insert(customers).values({
      name: body.name,
      phone: body.phone || null,
      address: body.address || null,
      customerType: body.customerType || "farmer",
      hasPurchaseHistory: body.hasPurchaseHistory || false,
      hasCreditHistory: body.hasCreditHistory || false,
      notes: body.notes || null,
    }).returning();

    await logActivity(session.userId, "create", `ثبت مشتری جدید: ${body.name}`, "customer", customer.id);
    return NextResponse.json({ customer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در ثبت مشتری" }, { status: 500 });
  }
}
