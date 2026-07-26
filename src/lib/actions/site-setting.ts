"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function updateHeroImage(heroImageUrl: string) {
  await requireRole("KEPALA_LAB", "LABORAN");

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: { heroImageUrl },
    create: { id: "singleton", heroImageUrl },
  });

  revalidatePath("/");
  revalidatePath("/kelola-data");
}

export async function removeHeroImage() {
  await requireRole("KEPALA_LAB", "LABORAN");

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    update: { heroImageUrl: null },
    create: { id: "singleton", heroImageUrl: null },
  });

  revalidatePath("/");
  revalidatePath("/kelola-data");
}
