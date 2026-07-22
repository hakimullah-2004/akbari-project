import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signToken, logActivity } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "نام کاربری و رمز عبور الزامی است" }, { status: 400 });
    }

    const [user] = await db.select().from(users).where(eq(users.username, username));
    if (!user) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور نادرست است" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: "حساب کاربری غیرفعال است" }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور نادرست است" }, { status: 401 });
    }

    const token = await signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
    });

    const isHttps = request.nextUrl.protocol === "https:";

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    cookieStore.set("last_activity", String(Date.now()), {
      httpOnly: true,
      secure: isHttps,
      sameSite: isHttps ? "none" : "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    await logActivity(user.id, "login", `ورود به سیستم توسط ${user.username}`);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
