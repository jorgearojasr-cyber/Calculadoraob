"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { put } from "@vercel/blob";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { STALE_SESSION_ERROR, isStaleUserError } from "@/lib/stale-session";
import { MAX_PHOTO_SIZE_BYTES, MAX_PHOTOS_PER_PROJECT, isAllowedPhotoType } from "@/lib/project-photos";

export async function uploadProjectPhotoAction(
  savedProjectId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "No hay sesión activa." };

  const project = await prisma.savedProject.findUnique({
    where: { id: savedProjectId },
    include: { _count: { select: { photos: true } } },
  });
  if (!project || project.userId !== session.user.id) return { error: "Proyecto no encontrado." };
  if (project._count.photos >= MAX_PHOTOS_PER_PROJECT) {
    return { error: `Ya subiste el máximo de ${MAX_PHOTOS_PER_PROJECT} fotos para este proyecto.` };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return { error: "Elige una foto primero." };
  if (!isAllowedPhotoType(file.type)) {
    return { error: "Formato no admitido. Sube una foto en JPG, PNG o WEBP." };
  }
  if (file.size > MAX_PHOTO_SIZE_BYTES) {
    return { error: `La foto pesa demasiado (máximo ${MAX_PHOTO_SIZE_BYTES / 1024 / 1024}MB).` };
  }

  let blob;
  try {
    blob = await put(`project-photos/${savedProjectId}-${Date.now()}-${file.name}`, file, {
      access: "public",
    });
  } catch {
    return {
      error: "No pudimos subir la foto (almacenamiento no disponible). Inténtalo más tarde.",
    };
  }

  try {
    await prisma.projectPhoto.create({
      data: {
        userId: session.user.id,
        savedProjectId,
        moduleId: project.moduleId,
        url: blob.url,
        status: "PENDING",
      },
    });
  } catch (error) {
    if (isStaleUserError(error)) return { error: STALE_SESSION_ERROR };
    throw error;
  }

  revalidatePath(`/proyectos/${savedProjectId}`);
  return {};
}
