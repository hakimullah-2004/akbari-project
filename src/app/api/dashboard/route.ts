import { NextResponse } from "next/server";
import { db } from "@/db";
import { sales, purchases, expenses, products, saleItems } from "@/db/schema";
import { sql, gte, and, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

  const [todaySalesResult] = await db
    .select({ total: sql<string>`coalesce(sum(final_amount), 0)`, count: sql<number>`count(*)` })
    .from(sales)
    .where(and(gte(sales.saleDate, today), lte(sales.saleDate, todayEnd)));

  const [monthSalesResult] = await db
    .select({ total: sql<string>`coalesce(sum(final_amount), 0)` })
    .from(sales)
    .where(and(gte(sales.saleDate, monthStart), lte(sales.saleDate, monthEnd)));

  const [todayPurchasesResult] = await db
    .select({ total: sql<string>`coalesce(sum(total_amount), 0)` })
    .from(purchases)
    .where(and(gte(purchases.purchaseDate, today), lte(purchases.purchaseDate, todayEnd)));

  const [totalExpensesResult] = await db
    .select({ total: sql<string>`coalesce(sum(amount), 0)` })
    .from(expenses)
    .where(and(gte(expenses.expenseDate, monthStart), lte(expenses.expenseDate, monthEnd)));

  const lowStockProducts = await db
    .select({ id: products.id, name: products.name, currentStock: products.currentStock, minStock: products.minStock, unit: products.unit })
    .from(products)
    .where(sql`current_stock <= min_stock AND is_active = true`)
    .limit(10);

  const expiringProducts = await db
    .select({ id: products.id, name: products.name, expiryDate: products.expiryDate, currentStock: products.currentStock })
    .from(products)
    .where(sql`expiry_date IS NOT NULL AND expiry_date <= NOW() + INTERVAL '30 days' AND expiry_date >= NOW() AND is_active = true`)
    .limit(10);

  const expiredProducts = await db
    .select({ id: products.id, name: products.name, expiryDate: products.expiryDate })
    .from(products)
    .where(sql`expiry_date IS NOT NULL AND expiry_date < NOW() AND is_active = true`)
    .limit(10);

  // Monthly sales chart (last 6 months)
  const salesChart = await db.execute(sql`
    SELECT 
      TO_CHAR(sale_date, 'YYYY-MM') as month,
      COALESCE(SUM(final_amount), 0) as total
    FROM sales
    WHERE sale_date >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(sale_date, 'YYYY-MM')
    ORDER BY month
  `);

  const purchasesChart = await db.execute(sql`
    SELECT 
      TO_CHAR(purchase_date, 'YYYY-MM') as month,
      COALESCE(SUM(total_amount), 0) as total
    FROM purchases
    WHERE purchase_date >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(purchase_date, 'YYYY-MM')
    ORDER BY month
  `);

  const expensesChart = await db.execute(sql`
    SELECT 
      TO_CHAR(expense_date, 'YYYY-MM') as month,
      COALESCE(SUM(amount), 0) as total
    FROM expenses
    WHERE expense_date >= NOW() - INTERVAL '6 months'
    GROUP BY TO_CHAR(expense_date, 'YYYY-MM')
    ORDER BY month
  `);

  const [totalStockValue] = await db
    .select({ total: sql<string>`coalesce(sum(current_stock::numeric * purchase_price::numeric), 0)` })
    .from(products)
    .where(sql`is_active = true`);

  const [totalDebtResult] = await db
    .select({ total: sql<string>`coalesce(sum(remaining_amount), 0)` })
    .from(sales)
    .where(sql`is_credit = true AND is_paid = false`);

  return NextResponse.json({
    todaySales: parseFloat(todaySalesResult?.total || "0"),
    todaySalesCount: Number(todaySalesResult?.count || 0),
    monthSales: parseFloat(monthSalesResult?.total || "0"),
    todayPurchases: parseFloat(todayPurchasesResult?.total || "0"),
    monthExpenses: parseFloat(totalExpensesResult?.total || "0"),
    totalStockValue: parseFloat(totalStockValue?.total || "0"),
    totalDebt: parseFloat(totalDebtResult?.total || "0"),
    lowStockProducts,
    expiringProducts,
    expiredProducts,
    salesChart: salesChart.rows,
    purchasesChart: purchasesChart.rows,
    expensesChart: expensesChart.rows,
  });
}
