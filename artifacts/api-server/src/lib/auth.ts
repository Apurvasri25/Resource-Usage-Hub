import { getAuth, createClerkClient } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

// Instantiate once — reuses the connection pool
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

export async function getOrCreateUser(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) return null;

  // Fast path: user already exists
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  if (existing.length > 0) return existing[0];

  // Fetch real user data from Clerk's backend API — session claims don't
  // include email/name unless a custom JWT template is configured.
  let email = `${userId}@clerk.placeholder`;
  let firstName = "";
  let lastName = "";
  try {
    const clerkUser = await clerk.users.getUser(userId);
    email = clerkUser.emailAddresses[0]?.emailAddress ?? email;
    firstName = clerkUser.firstName ?? "";
    lastName = clerkUser.lastName ?? "";
  } catch (err) {
    // Non-fatal: placeholder email guarantees the insert still succeeds
    req.log?.warn({ err, userId }, "Could not fetch Clerk user data; using placeholder email");
  }

  // Auto-promote the very first real (non-demo) Clerk user to SYSTEM_ADMIN
  const allClerkIds = await db.select({ clerkId: usersTable.clerkId }).from(usersTable);
  const realUserCount = allClerkIds.filter(u => !u.clerkId.startsWith("demo_")).length;
  const isFirstRealUser = realUserCount === 0;

  // onConflictDoNothing handles the race condition where two concurrent
  // requests both find the user missing and both try to insert.
  const [inserted] = await db
    .insert(usersTable)
    .values({
      clerkId: userId,
      email,
      firstName,
      lastName,
      role: isFirstRealUser ? "SYSTEM_ADMIN" : "RESEARCHER",
    })
    .onConflictDoNothing({ target: usersTable.clerkId })
    .returning();

  if (inserted) return inserted;

  // If the insert was a no-op (race condition), re-fetch
  const [refetched] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId))
    .limit(1);
  return refetched ?? null;
}

export async function getCurrentDbUser(req: Request) {
  const { userId } = getAuth(req);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId)).limit(1);
  return user ?? null;
}
