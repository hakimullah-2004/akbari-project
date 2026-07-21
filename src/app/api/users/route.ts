import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession, logActivity } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.select({
    id: users.id,
    username: users.username,
    fullName: users.fullName,
    role: users.role,
    phone: users.phone,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users).orderBy(desc(users.createdAt));

  return NextResponse.json({ users: result });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const hashed = await bcrypt.hash(body.password, 10);

  const [user] = await db.insert(users).values({
    username: body.username,
    password: hashed,
    fullName: body.fullName,
    role: body.role,
    phone: body.phone || null,
    isActive: true,
  }).returning();

  await logActivity(session.userId, "create", `ایجاد کاربر جدید: ${body.username}`, "user", user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role } });
}
