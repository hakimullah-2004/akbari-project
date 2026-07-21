import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activityLogs, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "50");

  const logs = await db
    .select({
      id: activityLogs.id,
      userId: activityLogs.userId,
      userName: users.fullName,
      username: users.username,
      activityType: activityLogs.activityType,
      description: activityLogs.description,
      entityType: activityLogs.entityType,
      entityId: activityLogs.entityId,
      createdAt: activityLogs.createdAt,
    })
    .from(activityLogs)
    .leftJoin(users, eq(activityLogs.userId, users.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(limit);

  return NextResponse.json({ logs });
}
