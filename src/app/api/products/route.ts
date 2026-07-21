import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, categories } from "@/db/schema";
import { eq, like, or, sql, desc, and } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const type = searchParams.get("type") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const lowStock = searchParams.get("lowStock") === "true";
  const expiring = searchParams.get("expiring") === "true";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  let conditions = [sql`${products.isActive} = true`];

  if (search) {
    conditions.push(
      or(
        like(products.name, `%${search}%`),
        like(products.brand || sql`''`, `%${search}%`),
        like(products.barcode || sql`''`, `%${search}%`)
      )!
    );
  }

  if (type === "agricultural" || type === "livestock") {
    conditions.push(sql`${products.productType} = ${type}`);
  }

  if (categoryId) {
    conditions.push(eq(products.categoryId, parseInt(categoryId)));
  }

  if (lowStock) {
    conditions.push(sql`${products.currentStock} <= ${products.minStock}`);
  }

  if (expiring) {
    conditions.push(sql`expiry_date IS NOT NULL AND expiry_date <= NOW() + INTERVAL '30 days' AND expiry_date >= NOW()`);
  }

  const result = await db
    .select({
      id: products.id,
      name: products.name,
      categoryId: products.categoryId,
      categoryName: categories.name,
      productType: products.productType,
      brand: products.brand,
      manufacturer: products.manufacturer,
      countryOfOrigin: products.countryOfOrigin,
      serialNumber: products.serialNumber,
      barcode: products.barcode,
      unit: products.unit,
      productionDate: products.productionDate,
      expiryDate: products.expiryDate,
      purchasePrice: products.purchasePrice,
      salePrice: products.salePrice,
      currentStock: products.currentStock,
      minStock: products.minStock,
      storageLocation: products.storageLocation,
      description: products.description,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(desc(products.createdAt))
    .limit(limit)
    .offset(offset);

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .where(and(...conditions));

  return NextResponse.json({
    products: result,
    total: Number(countResult?.count || 0),
    page,
    limit,
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const [product] = await db.insert(products).values({
      name: body.name,
      categoryId: body.categoryId || null,
      productType: body.productType,
      brand: body.brand || null,
      manufacturer: body.manufacturer || null,
      countryOfOrigin: body.countryOfOrigin || null,
      serialNumber: body.serialNumber || null,
      barcode: body.barcode || null,
      unit: body.unit,
      productionDate: body.productionDate || null,
      expiryDate: body.expiryDate || null,
      purchasePrice: body.purchasePrice || "0",
      salePrice: body.salePrice || "0",
      currentStock: body.currentStock || "0",
      minStock: body.minStock || "0",
      storageLocation: body.storageLocation || null,
      description: body.description || null,
    }).returning();

    await logActivity(session.userId, "create", `ثبت جنس جدید: ${body.name}`, "product", product.id);

    return NextResponse.json({ product });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در ثبت جنس" }, { status: 500 });
  }
}
