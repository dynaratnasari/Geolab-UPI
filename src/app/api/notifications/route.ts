import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { profileId: profile.id },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.notification.count({ where: { profileId: profile.id, read: false } }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}
