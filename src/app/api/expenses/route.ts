import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { expenses, users } from "@/db/schema";
import { desc, sql, and, gte, lte, eq } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const category = searchParams.get("category");

  let conditions: ReturnType<typeof sql>[] = [];
  if (from) conditions.push(gte(expenses.expenseDate, new Date(from)));
  if (to) conditions.push(lte(expenses.expenseDate, new Date(to)));
  if (category) conditions.push(sql`${expenses.category} = ${category}`);

  const result = await db
    .select({
      id: expenses.id,
      category: expenses.category,
      description: expenses.description,
      amount: expenses.amount,
      expenseDate: expenses.expenseDate,
      userName: users.fullName,
    })
    .from(expenses)
    .leftJoin(users, eq(expenses.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(expenses.expenseDate));

  const [totalResult] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(expenses)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  return NextResponse.json({ expenses: result, total: parseFloat(totalResult?.total || "0") });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const [expense] = await db.insert(expenses).values({
    category: body.category,
    description: body.description || null,
    amount: String(body.amount),
    userId: session.userId,
    expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
  }).returning();

  await logActivity(session.userId, "create", `ثبت مصرف: ${body.description || body.category}`, "expense", expense.id);
  return NextResponse.json({ expense });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });

  await db.delete(expenses).where(eq(expenses.id, parseInt(id)));
  await logActivity(session.userId, "delete", `حذف مصرف با شناسه ${id}`, "expense", parseInt(id));
  return NextResponse.json({ success: true });
}
