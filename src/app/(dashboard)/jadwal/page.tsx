import { requireRole } from "@/lib/auth";
import { JadwalClient } from "@/components/jadwal/jadwal-client";
import { getAllSchedules } from "@/lib/queries/jadwal";

export default async function JadwalPage() {
  await requireRole();
  const schedules = await getAllSchedules();
  return <JadwalClient schedules={schedules} />;
}
