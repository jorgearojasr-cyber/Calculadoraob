// Una sesión JWT puede seguir siendo válida aunque el usuario ya no exista
// en la base de datos (cuenta borrada, tabla de usuarios limpiada). En ese
// caso, cualquier create/upsert que use el userId de la sesión falla con
// violación de foreign key (código Prisma P2003) — sin este resguardo, el
// fallo era silencioso para el usuario.
//
// Nota: este archivo se importa desde componentes cliente (para las
// constantes), así que NO debe importar el cliente Prisma (runtime
// solo-Node). El chequeo del error se hace por forma (código P2003), sin
// depender de la clase PrismaClientKnownRequestError.
export const STALE_SESSION_ERROR = "stale-session";

export const STALE_SESSION_MESSAGE =
  "Tu sesión ya no es válida, por favor inicia sesión de nuevo.";

export function isStaleUserError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2003"
  );
}
