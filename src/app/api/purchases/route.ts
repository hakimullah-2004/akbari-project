import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchases, purchaseItems, products, suppliers, stockTransactions } from "@/db/schema";
import { eq, desc, sql, and, gte, lte } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  let conditions: ReturnType<typeof sql>[] = [];
  if (from) conditions.push(gte(purchases.purchaseDate, new Date(from)));
  if (to) conditions.push(lte(purchases.purchaseDate, new Date(to)));

  const result = await db
    .select({
      id: purchases.id,
      invoiceNumber: purchases.invoiceNumber,
      supplierId: purchases.supplierId,
      supplierName: suppliers.name,
      totalAmount: purchases.totalAmount,
      paidAmount: purchases.paidAmount,
      purchaseDate: purchases.purchaseDate,
      notes: purchases.notes,
    })
    .from(purchases)
    .leftJoin(suppliers, eq(purchases.supplierId, suppliers.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(purchases.purchaseDate))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db.select({ count: sql<number>`count(*)` }).from(purchases).where(conditions.length > 0 ? and(...conditions) : undefined);

  return NextResponse.json({ purchases: result, total: Number(countResult?.count || 0), page, limit });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();

    const totalAmount = body.items.reduce((sum: number, item: { quantity: number; unitPrice: number }) =>
      sum + item.quantity * item.unitPrice, 0);

    const [purchase] = await db.insert(purchases).values({
      invoiceNumber: body.invoiceNumber || null,
      supplierId: body.supplierId || null,
      userId: session.userId,
      totalAmount: String(totalAmount),
      paidAmount: String(body.paidAmount || totalAmount),
      notes: body.notes || null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
    }).returning();

    for (const item of body.items) {
      const itemTotal = item.quantity * item.unitPrice;
      await db.insert(purchaseItems).values({
        purchaseId: purchase.id,
        productId: item.productId,
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
        totalPrice: String(itemTotal),
      });

      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        const prevStock = parseFloat(String(product.currentStock));
        const newStock = prevStock + item.quantity;
        await db.update(products).set({
          currentStock: String(newStock),
          purchasePrice: String(item.unitPrice),
          updatedAt: new Date(),
        }).where(eq(products.id, item.productId));

        await db.insert(stockTransactions).values({
          productId: item.productId,
          transactionType: "purchase",
          quantity: String(item.quantity),
          previousStock: String(prevStock),
          newStock: String(newStock),
          referenceId: purchase.id,
          referenceType: "purchase",
          userId: session.userId,
        });
      }
    }

    await logActivity(session.userId, "create", `ثبت خرید به مبلغ ${totalAmount} افغانی`, "purchase", purchase.id);
    return NextResponse.json({ purchase });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در ثبت خرید" }, { status: 500 });
  }
}
