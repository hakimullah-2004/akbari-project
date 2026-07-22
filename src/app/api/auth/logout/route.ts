import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, logActivity } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getSession();
    if (session) {
      await logActivity(session.userId, "logout", `خروج از سیستم توسط ${session.username}`);
    }
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
    cookieStore.delete("last_activity");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "خطای سرور" }, { status: 500 });
  }
}
