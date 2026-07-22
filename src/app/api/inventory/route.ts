import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, stockTransactions, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("productId");
  const limit = parseInt(searchParams.get("limit") || "50");

  const baseQuery = db
    .select({
      id: stockTransactions.id,
      productId: stockTransactions.productId,
      productName: products.name,
      productUnit: products.unit,
      productStorageLocation: products.storageLocation,
      transactionType: stockTransactions.transactionType,
      quantity: stockTransactions.quantity,
      previousStock: stockTransactions.previousStock,
      newStock: stockTransactions.newStock,
      referenceType: stockTransactions.referenceType,
      notes: stockTransactions.notes,
      userName: users.fullName,
      createdAt: stockTransactions.createdAt,
    })
    .from(stockTransactions)
    .leftJoin(products, eq(stockTransactions.productId, products.id))
    .leftJoin(users, eq(stockTransactions.userId, users.id))
    .orderBy(desc(stockTransactions.createdAt))
    .limit(limit);

  const logs = productId
    ? await baseQuery.where(eq(stockTransactions.productId, parseInt(productId)))
    : await baseQuery;

  return NextResponse.json({ logs });
}

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "فقط مدیر سیستم می‌تواند حذف کند" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "شناسه لازم است" }, { status: 400 });

  try {
    const logId = parseInt(id);
    const [log] = await db.select().from(stockTransactions).where(eq(stockTransactions.id, logId));
    if (!log) return NextResponse.json({ error: "تراکنش پیدا نشد" }, { status: 404 });

    // Find the most recent transaction for this product
    const [latest] = await db
      .select({ id: stockTransactions.id })
      .from(stockTransactions)
      .where(eq(stockTransactions.productId, log.productId))
      .orderBy(desc(stockTransactions.id))
      .limit(1);

    let stockRestored = false;
    if (latest && latest.id === logId) {
      await db.update(products).set({ currentStock: log.previousStock, updatedAt: new Date() }).where(eq(products.id, log.productId));
      stockRestored = true;
    }

    await db.delete(stockTransactions).where(eq(stockTransactions.id, logId));
    await logActivity(session.userId, "delete", `حذف تراکنش موجودی با شناسه ${logId}`, "inventory", logId);

    return NextResponse.json({
      success: true,
      message: stockRestored
        ? "تراکنش حذف شد و موجودی به حالت قبل بازگشت"
        : "تراکنش حذف شد (چون تراکنش‌های جدیدتری برای این جنس ثبت شده، موجودی فعلی تغییر نکرد)",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در حذف تراکنش" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const { productId, transactionType, quantity, notes } = body;

    const [product] = await db.select().from(products).where(eq(products.id, productId));
    if (!product) return NextResponse.json({ error: "جنس پیدا نشد" }, { status: 404 });

    const prevStock = parseFloat(String(product.currentStock));
    let newStock: number;

    if (transactionType === "adjustment") {
      newStock = quantity;
    } else if (transactionType === "purchase") {
      newStock = prevStock + quantity;
    } else {
      newStock = prevStock - quantity;
    }

    await db.update(products).set({ currentStock: String(newStock), updatedAt: new Date() }).where(eq(products.id, productId));

    const [transaction] = await db.insert(stockTransactions).values({
      productId,
      transactionType,
      quantity: String(quantity),
      previousStock: String(prevStock),
      newStock: String(newStock),
      notes: notes || null,
      userId: session.userId,
    }).returning();

    await logActivity(session.userId, "update", `تنظیم موجودی جنس ${product.name}`, "inventory", transaction.id);
    return NextResponse.json({ transaction, newStock });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در تنظیم موجودی" }, { status: 500 });
  }
}
