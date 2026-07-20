"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function registerUserAction(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ error?: string }> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) return { error: "El nombre es obligatorio." };
  if (!email || !email.includes("@")) return { error: "Ingresa un email válido." };
  if (password.length < 8) return { error: "La contraseña debe tener al menos 8 caracteres." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Ya existe una cuenta con ese email." };

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { name, email, passwordHash } });

  return {};
}
