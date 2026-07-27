import "server-only";
import { prisma } from "@/lib/prisma";
import type { NotificationType, Role } from "@prisma/client";

/** Builds one Notification.create() call per profile with the given role (e.g. every Laboran),
 *  meant to be spread into a `$transaction([...])` array alongside the status-change writes. */
export async function notifyRole(role: Role, data: { type: NotificationType; title: string; message: string }) {
  const profiles = await prisma.profile.findMany({ where: { role }, select: { id: true } });
  return profiles.map((p) => prisma.notification.create({ data: { profileId: p.id, ...data } }));
}
