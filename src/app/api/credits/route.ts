import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { creditPayments, sales, customers } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { saleId, amount, notes } = body;

    const [sale] = await db.select().from(sales).where(eq(sales.id, saleId));
    if (!sale) return NextResponse.json({ error: "بل پیدا نشد" }, { status: 404 });

    const payAmount = Math.min(amount, parseFloat(String(sale.remainingAmount)));
    const newRemaining = parseFloat(String(sale.remainingAmount)) - payAmount;
    const newPaid = parseFloat(String(sale.paidAmount)) + payAmount;
    const isPaid = newRemaining <= 0;

    await db.update(sales).set({
      paidAmount: String(newPaid),
      remainingAmount: String(newRemaining),
      isPaid,
    }).where(eq(sales.id, saleId));

    const [payment] = await db.insert(creditPayments).values({
      saleId,
      customerId: sale.customerId!,
      amount: String(payAmount),
      notes: notes || null,
      userId: session.userId,
    }).returning();

    if (sale.customerId) {
      await db.update(customers).set({
        totalDebt: sql`total_debt - ${payAmount}`,
        updatedAt: new Date(),
      }).where(eq(customers.id, sale.customerId));
    }

    await logActivity(session.userId, "create", `ثبت پرداخت نسیه به مبلغ ${payAmount} افغانی`, "credit_payment", payment.id);
    return NextResponse.json({ payment, newRemaining, isPaid });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در ثبت پرداخت" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const saleId = searchParams.get("saleId");

  if (saleId) {
    const payments = await db.select().from(creditPayments).where(eq(creditPayments.saleId, parseInt(saleId)));
    return NextResponse.json({ payments });
  }

  const debtors = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
      address: customers.address,
      totalDebt: customers.totalDebt,
    })
    .from(customers)
    .where(sql`total_debt > 0`)
    .orderBy(sql`total_debt DESC`);

  return NextResponse.json({ debtors });
}
