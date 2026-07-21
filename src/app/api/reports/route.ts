import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sales, purchases, expenses, products, customers, saleItems } from "@/db/schema";
import { sql, and, gte, lte, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "summary";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to ? new Date(to) : new Date();

  if (type === "summary") {
    const [salesResult] = await db.select({ total: sql<string>`coalesce(sum(final_amount), 0)`, count: sql<number>`count(*)` })
      .from(sales).where(and(gte(sales.saleDate, fromDate), lte(sales.saleDate, toDate)));

    const [purchasesResult] = await db.select({ total: sql<string>`coalesce(sum(total_amount), 0)`, count: sql<number>`count(*)` })
      .from(purchases).where(and(gte(purchases.purchaseDate, fromDate), lte(purchases.purchaseDate, toDate)));

    const [expensesResult] = await db.select({ total: sql<string>`coalesce(sum(amount), 0)` })
      .from(expenses).where(and(gte(expenses.expenseDate, fromDate), lte(expenses.expenseDate, toDate)));

    const [purchaseCostResult] = await db.select({ total: sql<string>`coalesce(sum(si.total_price * (p.purchase_price / NULLIF(p.sale_price, 0))), 0)` })
      .from(saleItems).leftJoin(products, eq(saleItems.productId, products.id))
      .leftJoin(sales, eq(saleItems.saleId, sales.id))
      .where(and(gte(sales.saleDate, fromDate), lte(sales.saleDate, toDate)));

    const totalSales = parseFloat(salesResult?.total || "0");
    const totalExpenses = parseFloat(expensesResult?.total || "0");
    const totalPurchases = parseFloat(purchasesResult?.total || "0");
    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    return NextResponse.json({
      totalSales,
      salesCount: Number(salesResult?.count || 0),
      totalPurchases,
      purchasesCount: Number(purchasesResult?.count || 0),
      totalExpenses,
      grossProfit,
      netProfit,
    });
  }

  if (type === "daily-sales") {
    const result = await db.execute(sql`
      SELECT 
        DATE(sale_date) as date,
        COUNT(*) as count,
        SUM(final_amount) as total,
        SUM(CASE WHEN is_credit THEN final_amount ELSE 0 END) as credit_total,
        SUM(CASE WHEN NOT is_credit THEN final_amount ELSE 0 END) as cash_total
      FROM sales
      WHERE sale_date >= ${fromDate} AND sale_date <= ${toDate}
      GROUP BY DATE(sale_date)
      ORDER BY date DESC
    `);
    return NextResponse.json({ data: result.rows });
  }

  if (type === "inventory") {
    const result = await db
      .select({
        id: products.id,
        name: products.name,
        unit: products.unit,
        currentStock: products.currentStock,
        minStock: products.minStock,
        purchasePrice: products.purchasePrice,
        salePrice: products.salePrice,
        expiryDate: products.expiryDate,
        storageLocation: products.storageLocation,
      })
      .from(products)
      .where(sql`is_active = true`)
      .orderBy(products.name);
    return NextResponse.json({ data: result });
  }

  if (type === "debtors") {
    const result = await db
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
    return NextResponse.json({ data: result });
  }

  if (type === "expired") {
    const result = await db.select().from(products).where(sql`expiry_date IS NOT NULL AND expiry_date < NOW() AND is_active = true`).orderBy(products.expiryDate);
    return NextResponse.json({ data: result });
  }

  if (type === "low-stock") {
    const result = await db.select().from(products).where(sql`current_stock <= min_stock AND is_active = true`).orderBy(products.currentStock);
    return NextResponse.json({ data: result });
  }

  if (type === "expenses-breakdown") {
    const result = await db.execute(sql`
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total
      FROM expenses
      WHERE expense_date >= ${fromDate} AND expense_date <= ${toDate}
      GROUP BY category
      ORDER BY total DESC
    `);
    return NextResponse.json({ data: result.rows });
  }

  return NextResponse.json({ error: "نوع گزارش نامعتبر" }, { status: 400 });
}
