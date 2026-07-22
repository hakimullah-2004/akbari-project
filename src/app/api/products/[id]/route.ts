import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession, logActivity } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = await request.json();

    const [product] = await db
      .update(products)
      .set({
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
        minStock: body.minStock || "0",
        storageLocation: body.storageLocation || null,
        description: body.description || null,
        updatedAt: new Date(),
      })
      .where(eq(products.id, parseInt(id)))
      .returning();

    await logActivity(session.userId, "update", `ویرایش جنس: ${body.name}`, "product", product.id);

    return NextResponse.json({ product });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در ویرایش جنس" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "فقط مدیر سیستم می‌تواند حذف کند" }, { status: 401 });

  try {
    const { id } = await params;
    await db.update(products).set({ isActive: false, updatedAt: new Date() }).where(eq(products.id, parseInt(id)));
    await logActivity(session.userId, "delete", `حذف جنس با شناسه ${id}`, "product", parseInt(id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "خطا در حذف جنس" }, { status: 500 });
  }
}
