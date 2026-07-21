import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, activityLogs } from "@/db/schema";
import { eq } from "drizzle-orm";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dana-agri-store-secret-key-2024"
);

export interface JWTPayload {
  userId: number;
  username: string;
  role: string;
  fullName: string;
}

export async function signToken(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const [user] = await db.select().from(users).where(eq(users.id, session.userId));
  return user || null;
}

export async function logActivity(
  userId: number,
  activityType: "login" | "logout" | "create" | "update" | "delete" | "print" | "download" | "view",
  description: string,
  entityType?: string,
  entityId?: number
) {
  try {
    await db.insert(activityLogs).values({
      userId,
      activityType,
      description,
      entityType: entityType || null,
      entityId: entityId || null,
    });
  } catch {
    // silently fail
  }
}

export function hasPermission(role: string, action: string): boolean {
  const permissions: Record<string, string[]> = {
    admin: ["*"],
    store_manager: ["dashboard", "products", "customers", "sales", "purchases", "expenses", "suppliers", "reports", "inventory", "credits"],
    seller: ["dashboard", "products:read", "customers", "sales", "credits:read"],
    warehouse: ["dashboard", "products", "inventory", "purchases"],
    accountant: ["dashboard", "reports", "expenses", "credits", "sales:read", "purchases:read"],
  };

  const userPerms = permissions[role] || [];
  if (userPerms.includes("*")) return true;
  if (userPerms.includes(action)) return true;
  const baseAction = action.split(":")[0];
  if (userPerms.includes(baseAction)) return true;
  return false;
}
