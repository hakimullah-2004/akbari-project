import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, saleItems, products, customers, stockTransactions } from "@/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const isCredit = searchParams.get("isCredit");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let conditions: ReturnType<typeof sql>[] = [];
  if (from) conditions.push(gte(sales.saleDate, new Date(from)));
  if (to) conditions.push(lte(sales.saleDate, new Date(to)));
  if (isCredit === "true") conditions.push(eq(sales.isCredit, true));

  const result = await db
    .select({
      id: sales.id,
      invoiceNumber: sales.invoiceNumber,
      customerId: sales.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      totalAmount: sales.totalAmount,
      discountAmount: sales.discountAmount,
      finalAmount: sales.finalAmount,
      paidAmount: sales.paidAmount,
      remainingAmount: sales.remainingAmount,
      isCredit: sales.isCredit,
      isPaid: sales.isPaid,
      saleDate: sales.saleDate,
      notes: sales.notes,
    })
    .from(sales)
    .leftJoin(customers, eq(sales.customerId, customers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(sales.saleDate))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(sales).where(conditions.length > 0 ? and(...conditions) : undefined);

  return NextResponse.json({ sales: result, total: Number(countResult?.count || 0), page, limit });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const invoiceNumber = generateInvoiceNumber();

    const totalAmount = body.items.reduce((sum: number, item: { quantity: number; unitPrice: number; discount: number }) =>
      sum + item.quantity * item.unitPrice, 0);
    const discountAmount = body.discountAmount || 0;
    const finalAmount = totalAmount - discountAmount;
    const paidAmount = body.paidAmount || finalAmount;
    const remainingAmount = finalAmount - paidAmount;
    const isCredit = remainingAmount > 0;
    const isPaid = remainingAmount <= 0;

    const [sale] = await db.insert(sales).values({
      invoiceNumber,
      customerId: body.customerId || null,
      userId: session.userId,
      totalAmount: String(totalAmount),
      discountAmount: String(discountAmount),
      finalAmount: String(finalAmount),
      paidAmount: String(paidAmount),
      remainingAmount: String(remainingAmount),
      isCredit,
      isPaid,
      notes: body.notes || null,
    }).returning();

    for (const item of body.items) {
      const itemTotal = item.quantity * item.unitPrice;
      await db.insert(saleItems).values({
        saleId: sale.id,
        productId: item.productId,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        discount: String(item.discount || 0),
        totalPrice: String(itemTotal),
      });

      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        const prevStock = parseFloat(String(product.currentStock));
        const newStock = prevStock - item.quantity;
        await db.update(products).set({ currentStock: String(newStock), updatedAt: new Date() }).where(eq(products.id, item.productId));
        await db.insert(stockTransactions).values({
          productId: item.productId,
          transactionType: "sale",
          quantity: String(item.quantity),
          previousStock: String(prevStock),
          newStock: String(newStock),
          referenceId: sale.id,
          referenceType: "sale",
          userId: session.userId,
        });
      }
    }

    if (body.customerId && isCredit) {
      await db.update(customers).set({
        totalDebt: sql`total_debt + ${remainingAmount}`,
        hasCreditHistory: true,
        hasPurchaseHistory: true,
        updatedAt: new Date(),
      }).where(eq(customers.id, body.customerId));
    } else if (body.customerId) {
      await db.update(customers).set({ hasPurchaseHistory: true, updatedAt: new Date() }).where(eq(customers.id, body.customerId));
    }

    await logActivity(session.userId, "create", `ثبت فروش بل شماره ${invoiceNumber}`, "sale", sale.id);

    return NextResponse.json({ sale, invoiceNumber });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در ثبت فروش" }, { status: 500 });
  }
}
