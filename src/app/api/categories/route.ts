import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.select().from(categories).orderBy(categories.productType, categories.name);
  return NextResponse.json({ categories: result });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const [category] = await db.insert(categories).values({
    name: body.name,
    productType: body.productType,
    description: body.description || null,
  }).returning();

  return NextResponse.json({ category });
}
