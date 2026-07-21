import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, saleItems, products, customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

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
