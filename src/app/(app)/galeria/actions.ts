"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STALE_SESSION_ERROR, isStaleUserError } from "@/lib/stale-session";
import {
  MAX_SHOWCASE_PHOTO_SIZE_BYTES,
  MAX_SHOWCASE_PHOTOS_PER_SIDE,
  MIN_SHOWCASE_PHOTOS_PER_SIDE,
  isAllowedShowcasePhotoType,
} from "@/lib/project-showcase";

async function uploadSide(files: File[], side: "before" | "after"): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const blob = await put(`showcase-photos/${side}-${Date.now()}-${file.name}`, file, {
      access: "public",
    });
    urls.push(blob.url);
  }
  return urls;
}

export async function createShowcaseAction(
  formData: FormData
): Promise<{ id: string; error?: undefined } | { error: string; id?: undefined }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const title = String(formData.get("title") || "").trim();
  const story = String(formData.get("story") || "").trim();
  const savedProjectId = String(formData.get("savedProjectId") || "").trim() || null;
  const beforeFiles = formData.getAll("photosBefore").filter((f): f is File => f instanceof File && f.size > 0);
  const afterFiles = formData.getAll("photosAfter").filter((f): f is File => f instanceof File && f.size > 0);

  if (!title) return { error: "Ponle un título a tu proyecto." };
  if (!story) return { error: "Cuéntanos un poco tu historia." };
  if (beforeFiles.length < MIN_SHOWCASE_PHOTOS_PER_SIDE) return { error: "Sube al menos 1 foto de antes." };
  if (afterFiles.length < MIN_SHOWCASE_PHOTOS_PER_SIDE) return { error: "Sube al menos 1 foto de después." };
  if (beforeFiles.length > MAX_SHOWCASE_PHOTOS_PER_SIDE || afterFiles.length > MAX_SHOWCASE_PHOTOS_PER_SIDE) {
    return { error: `Máximo ${MAX_SHOWCASE_PHOTOS_PER_SIDE} fotos por lado.` };
  }
  for (const file of [...beforeFiles, ...afterFiles]) {
    if (!isAllowedShowcasePhotoType(file.type)) {
      return { error: "Formato no admitido. Sube fotos en JPG, PNG o WEBP." };
    }
    if (file.size > MAX_SHOWCASE_PHOTO_SIZE_BYTES) {
      return { error: `Una foto pesa demasiado (máximo ${MAX_SHOWCASE_PHOTO_SIZE_BYTES / 1024 / 1024}MB).` };
    }
  }

  if (savedProjectId) {
    const project = await prisma.savedProject.findUnique({ where: { id: savedProjectId } });
    if (!project || project.userId !== session.user.id) return { error: "Proyecto no encontrado." };
  }

  let photosBefore: string[];
  let photosAfter: string[];
  try {
    photosBefore = await uploadSide(beforeFiles, "before");
    photosAfter = await uploadSide(afterFiles, "after");
  } catch {
    return { error: "No pudimos subir las fotos (almacenamiento no disponible). Inténtalo más tarde." };
  }

  let showcase;
  try {
    showcase = await prisma.projectShowcase.create({
      data: {
        userId: session.user.id,
        savedProjectId,
        title,
        story,
        photosBefore,
        photosAfter,
        status: "PENDING",
      },
    });
  } catch (error) {
    if (isStaleUserError(error)) return { error: STALE_SESSION_ERROR };
    throw error;
  }

  revalidatePath("/galeria");
  return { id: showcase.id };
}
