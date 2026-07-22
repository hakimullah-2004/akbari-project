import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession, logActivity } from "@/lib/auth";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Partial<typeof users.$inferInsert> = {
    fullName: body.fullName,
    role: body.role,
    phone: body.phone || null,
    isActive: body.isActive,
    updatedAt: new Date(),
  };

  if (body.password) {
    updateData.password = await bcrypt.hash(body.password, 10);
  }

  const [user] = await db.update(users).set(updateData).where(eq(users.id, parseInt(id))).returning();
  await logActivity(session.userId, "update", `ویرایش کاربر: ${user.username}`, "user", user.id);
  return NextResponse.json({ user: { id: user.id, username: user.username, fullName: user.fullName, role: user.role, isActive: user.isActive } });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (parseInt(id) === session.userId) return NextResponse.json({ error: "نمی‌توانید خود را حذف کنید" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const permanent = searchParams.get("permanent") === "true";

  if (permanent) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, parseInt(id)));
      await db.delete(users).where(eq(users.id, parseInt(id)));
      await logActivity(session.userId, "delete", `حذف کامل کاربر: ${user?.username || id}`, "user", parseInt(id));
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({
        error: "این کاربر دارای سوابق ثبت‌شده (فروش، فعالیت و ...) است و نمی‌توان آن را کاملاً حذف کرد. می‌توانید آن را غیرفعال کنید.",
      }, { status: 400 });
    }
  }

  await db.update(users).set({ isActive: false }).where(eq(users.id, parseInt(id)));
  await logActivity(session.userId, "delete", `غیرفعال کردن کاربر با شناسه ${id}`, "user", parseInt(id));
  return NextResponse.json({ success: true });
}
