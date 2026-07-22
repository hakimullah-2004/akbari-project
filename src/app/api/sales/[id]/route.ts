import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, saleItems, products, customers, stockTransactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [sale] = await db
    .select({
      id: sales.id,
      invoiceNumber: sales.invoiceNumber,
      customerId: sales.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerAddress: customers.address,
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
    .where(eq(sales.id, parseInt(id)));

  if (!sale) return NextResponse.json({ error: "بل پیدا نشد" }, { status: 404 });

  const items = await db
    .select({
      id: saleItems.id,
      productId: saleItems.productId,
      productName: products.name,
      unit: products.unit,
      quantity: saleItems.quantity,
      unitPrice: saleItems.unitPrice,
      discount: saleItems.discount,
      totalPrice: saleItems.totalPrice,
    })
    .from(saleItems)
    .leftJoin(products, eq(saleItems.productId, products.id))
    .where(eq(saleItems.saleId, parseInt(id)));

  return NextResponse.json({ sale, items });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "فقط مدیر سیستم می‌تواند حذف کند" }, { status: 401 });

  try {
    const { id } = await params;
    const saleId = parseInt(id);

    const [sale] = await db.select().from(sales).where(eq(sales.id, saleId));
    if (!sale) return NextResponse.json({ error: "بل پیدا نشد" }, { status: 404 });

    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, saleId));

    // Restore stock for each item
    for (const item of items) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        const prevStock = parseFloat(String(product.currentStock));
        const newStock = prevStock + parseFloat(String(item.quantity));
        await db.update(products).set({ currentStock: String(newStock), updatedAt: new Date() }).where(eq(products.id, item.productId));
        await db.insert(stockTransactions).values({
          productId: item.productId,
          transactionType: "adjustment",
          quantity: String(item.quantity),
          previousStock: String(prevStock),
          newStock: String(newStock),
          referenceId: saleId,
          referenceType: "sale_deleted",
          userId: session.userId,
          notes: "بازگشت موجودی به دلیل حذف بل فروش",
        });
      }
    }

    // Reverse customer debt if this was an unpaid credit sale
    if (sale.customerId && parseFloat(String(sale.remainingAmount)) > 0) {
      await db.update(customers).set({
        totalDebt: sql`total_debt - ${sale.remainingAmount}`,
        updatedAt: new Date(),
      }).where(eq(customers.id, sale.customerId));
    }

    await db.delete(saleItems).where(eq(saleItems.saleId, saleId));
    await db.delete(sales).where(eq(sales.id, saleId));

    await logActivity(session.userId, "delete", `حذف بل فروش شماره ${sale.invoiceNumber}`, "sale", saleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در حذف بل فروش" }, { status: 500 });
  }
}
