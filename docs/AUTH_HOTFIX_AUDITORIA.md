# Auditoría de Autenticación — Hotfix Producción

**Fecha:** 03-ago-2026
**Severidad del incidente:** Crítica — bloquea el ingreso de usuarios nuevos.
**Estado:** Auditoría completa. **Hallazgo #1 corregido e implementado (03-ago-2026)** — ver detalle al final de esa sección. Hallazgos #2 y #3 (Google Cloud Console / Vercel) en verificación manual por el usuario. Hallazgo #4 (recuperación de contraseña) no implementado, por instrucción explícita.

---

## Alcance real de esta auditoría (léase antes que el resto)

El stack de autenticación de ObraBien Calcula es **NextAuth v4.24 con estrategia JWT** (sin adapter de base de datos — `prisma.User` se gestiona a mano, no hay tablas `Account`/`Session`/`VerificationToken`). **No usa Supabase Auth** — el proveedor de autenticación es NextAuth directamente contra Postgres/Neon vía Prisma. Los puntos del pedido original sobre "Supabase/Auth" se auditaron igual, adaptados al proveedor real.

Puedo auditar con certeza todo lo que vive en este repositorio (código, variables que el código *espera*, ausencia de features). **No tengo acceso a la consola de Google Cloud, al dashboard de Vercel ni a las variables de entorno reales de Producción** (no hay CLI de Vercel autenticada en este entorno — verificado, `vercel whoami` falla). Todo lo relativo a esas 2 consolas externas está marcado explícitamente como **"requiere verificación manual"**, con la instrucción exacta de qué mirar — no es una confirmación de que estén mal configuradas, es la lista de sospechosos a descartar.

---

## Hallazgo #1 (código, confirmado) — Case-sensitivity en el login por email/contraseña

**Causa raíz probable:** El login (`authorize()` en `src/lib/auth.ts:24`) busca el usuario con `prisma.user.findUnique({ where: { email: credentials.email } })`, usando el email **tal cual lo tipeó el usuario**, sin normalizar. El registro (`src/app/(app)/registro/actions.ts:12`), en cambio, sí normaliza: `email.trim().toLowerCase()` antes de guardar. Postgres compara strings de forma case-sensitive por defecto.

**Evidencia:**
- `src/lib/auth.ts` línea 24: `const user = await prisma.user.findUnique({ where: { email: credentials.email } });` — sin `.toLowerCase()`.
- `src/app/(app)/registro/actions.ts` línea 12: `const email = input.email.trim().toLowerCase();` — sí normaliza antes de `prisma.user.create`.
- **Peor aún — reproducible el 100% de las veces para un caso concreto:** `src/app/(app)/registro/page.tsx` líneas 32-39. Justo después de crear la cuenta (con el email ya normalizado en BD), el mismo formulario llama `signIn("credentials", { email, password, ... })` usando el `email` tal cual lo tipeó el usuario en el input (sin normalizar). Si el usuario escribió su email con cualquier mayúscula (ej. `Juan@Gmail.com`, autocompletado del navegador, o solo la primera letra en mayúscula), la cuenta se crea correctamente pero el auto-login inmediato **falla siempre**, y el usuario es redirigido de vuelta a `/login` (línea 43: `if (signInResult?.error) { router.push("/login"); return; }`) — sin ningún mensaje de error explicando qué pasó. Desde la perspectiva del usuario: "me registré y no pude entrar".

**Severidad:** Alta. No es intermitente al azar — depende exactamente de si el usuario tipeó su email con alguna mayúscula, algo extremadamente común (autocompletado, teclado predictivo, hábito). Afecta tanto registro→auto-login como cualquier login posterior.

**Propuesta de solución:** Normalizar `credentials.email` con `.trim().toLowerCase()` en `authorize()` (`src/lib/auth.ts`), igual que ya hace `registerUserAction`. Un cambio de una línea, sin tocar esquema ni migraciones.

**Esfuerzo estimado:** Trivial (< 15 minutos incluyendo prueba).

**Estado: Implementado y validado (03-ago-2026).** Cambio aplicado en `src/lib/auth.ts` (`authorize()` ahora normaliza `credentials.email` con `.trim().toLowerCase()` antes de la búsqueda, igual que `registerUserAction`). Validación:
- `tsc --noEmit`: limpio. `eslint`: limpio. `next build`: exitoso, sin errores ni warnings.
- Probado manualmente end-to-end (usuario de prueba temporal, eliminado al terminar): registro con email en mayúsculas → auto-login exitoso (antes fallaba siempre); login posterior con el email en mayúsculas, en minúsculas, y en formato mixto → los 3 casos autentican correctamente contra la misma cuenta. Contraseña incorrecta sigue rechazándose con el mensaje de siempre (sin regresión).

---

## Hallazgo #2 (externo, requiere verificación manual) — Google OAuth "Acceso bloqueado"

**Causa raíz probable:** El mensaje exacto reportado — *"Acceso bloqueado. La solicitud de la aplicación no es válida."* — es el texto estándar que muestra Google cuando el `redirect_uri` que la app envía en la solicitud de autorización **no coincide** con ninguno de los "Authorized redirect URIs" configurados en el cliente OAuth de Google Cloud Console. Es el error de `redirect_uri_mismatch`, no un problema de credenciales inválidas.

En NextAuth v4, ese `redirect_uri` se construye a partir de `NEXTAUTH_URL` (si está seteada) o, si no está seteada, a partir de los headers de la request entrante (`host`/`x-forwarded-host`). La hipótesis con más evidencia circunstancial es que **`NEXTAUTH_URL` en el entorno de Producción de Vercel esté ausente, apuntando a un dominio antiguo/de preview, o con protocolo incorrecto (http en vez de https)** — lo que generaría un `redirect_uri` distinto al que Google tiene autorizado.

**Evidencia (código):**
- `.env.example` línea 7: `NEXTAUTH_URL="http://localhost:3000"` — confirma que la app depende de esta variable y que su valor de ejemplo es de desarrollo, no de producción (fácil de olvidar actualizar al desplegar).
- `src/lib/auth.ts` — `GoogleProvider({ clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! })`: si estas 2 variables faltaran directamente en Producción, el error típico de Google es distinto ("invalid_client"), no el reportado — esto hace **menos probable** que el problema sea Client ID/Secret ausentes, y **más probable** que sea específicamente el redirect URI.
- El proyecto está enlazado a Vercel (`.vercel/project.json`, `projectName: "calculadoraob"`), confirmando que existe un despliegue real — pero no tengo acceso a sus variables de entorno ni dominio exacto desde este entorno.

**Verificación manual requerida (en orden):**
1. En Vercel → Project Settings → Environment Variables: confirmar que `NEXTAUTH_URL` existe en **Production** (no solo en Preview/Development) y que su valor es exactamente `https://<dominio-real-de-producción>` (con `https://`, sin slash final, sin `/api/auth`).
2. En Google Cloud Console → APIs & Services → Credentials → el OAuth Client ID usado: confirmar en "Authorized redirect URIs" que existe exactamente `https://<dominio-real-de-producción>/api/auth/callback/google`. Si el dominio cambió alguna vez (ej. de un `.vercel.app` a un dominio propio), es común que solo quede la URI vieja.
3. En el mismo cliente OAuth: confirmar en "Authorized JavaScript origins" que existe `https://<dominio-real-de-producción>` (sin path).
4. Confirmar el **estado del proyecto OAuth** en la pantalla de consentimiento (OAuth consent screen): si sigue en modo "Testing" (no publicado), Google solo permite el login a usuarios explícitamente agregados como "Test users" — cualquier usuario nuevo real vería un bloqueo, con un mensaje ligeramente distinto pero relacionado ("no verificada por Google"/similar). Vale la pena descartarlo igual.
5. Confirmar que `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` en Vercel Production correspondan al **mismo** proyecto OAuth que se está inspeccionando en el punto 2 (un error común es tener 2 clientes OAuth — uno de dev, uno de prod — y mezclar las variables entre entornos).

**Severidad:** Crítica — bloquea el 100% de los intentos de login por Google, coincide exactamente con el síntoma reportado.

**Propuesta de solución:** Corregir la variable `NEXTAUTH_URL` en Vercel Production y/o agregar la redirect URI faltante en Google Cloud Console, según lo que confirme la verificación manual. Sin acceso a ambas consolas no puedo determinar cuál de las dos está mal — es casi seguro que sea una de las dos, no un problema de código.

**Esfuerzo estimado:** Bajo (5-15 minutos) una vez identificado cuál de los 2 valores está desalineado — es un cambio de configuración, no de código.

---

## Hallazgo #3 (externo, requiere verificación manual) — Posibles variables de entorno faltantes o inconsistentes entre Preview/Production

**Causa raíz probable:** No verificable desde este entorno, pero el código deja claro qué variables son obligatorias y cuáles fallan silenciosamente o con errores confusos si faltan.

**Evidencia (código) — variables que el código requiere, según `.env.example` y los imports de cada módulo:**

| Variable | Dónde se usa | Qué pasa si falta/está mal en Producción |
|---|---|---|
| `NEXTAUTH_URL` | NextAuth (redirect URIs, cookies) | Ver Hallazgo #2 |
| `NEXTAUTH_SECRET` | `src/middleware.ts:6` (`getToken`), NextAuth internamente (firma de JWT) | Si falta, NextAuth v4 lanza advertencia y en producción puede rechazar/generar tokens no verificables entre requests — sesión que "no persiste" (login parece funcionar pero se pierde la sesión al navegar), un síntoma coherente con "login por email tampoco funciona correctamente" |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | `src/lib/auth.ts` | Ver Hallazgo #2 |
| `DATABASE_URL` / `DATABASE_URL_UNPOOLED` | Prisma (todo el sitio, incluida `authorize()`) | Si la conexión falla dentro de `authorize()`, NextAuth v4 la trata igual que credenciales inválidas — el usuario ve "Email o contraseña incorrectos" aunque el problema sea de conexión a BD, no de sus datos. Esto enmascara el diagnóstico real y es importante tenerlo presente al reproducir el síntoma en Producción. |
| `BLOB_READ_WRITE_TOKEN` | Subida de fotos (no relacionado a auth) | Fuera de alcance de este incidente |

**Verificación manual requerida:**
- Comparar, variable por variable, el listado de Environment Variables de Vercel entre **Production** y **Preview** — confirmar que las 6 variables de arriba (menos `BLOB_READ_WRITE_TOKEN`) existen en **ambos** entornos y que, para `NEXTAUTH_URL`, el valor de Production es el dominio real (no el de preview).
- Si es posible, revisar los **Function Logs** de Vercel para la ruta `/api/auth/[...nextauth]` en Producción — un error de conexión a BD o de `NEXTAUTH_SECRET` ausente normalmente deja rastro ahí, y confirmaría o descartaría el Hallazgo #1/#3 sin necesidad de reproducir manualmente.

**Severidad:** Media-Alta (contribuyente probable, no necesariamente la causa raíz única).

**Propuesta de solución:** Sincronizar variables entre entornos; no hay cambio de código asociado.

**Esfuerzo estimado:** Bajo (15-30 minutos de revisión en el dashboard de Vercel).

---

## Hallazgo #4 (código, confirmado) — No existe recuperación de contraseña

**Respuesta directa a lo pedido:** **No existe. No está implementada y oculta — simplemente no existe ninguna parte del flujo.**

**Evidencia:**
- Búsqueda exhaustiva en `src/` de "olvid", "reset-password", "recuperar", "forgot": **0 resultados**.
- El modelo `User` en `prisma/schema.prisma` no tiene ningún campo de tipo `resetToken`/`resetTokenExpiry` ni tabla `VerificationToken` (la que NextAuth usa para flujos de "magic link"/reseteo cuando hay adapter) — confirma que nunca se implementó, ni siquiera parcialmente a nivel de datos.
- La página de login (`src/app/(app)/login/page.tsx`) no tiene ningún link "¿Olvidaste tu contraseña?".

**Severidad:** Alta como problema de producto (cualquier usuario que olvide su contraseña queda sin salida — su única opción hoy es registrarse de nuevo con otro email, o contactar soporte manualmente para un reset directo en BD), pero **no es la causa del incidente reportado** (los síntomas describen logins que fallan con contraseña correcta, no gente que olvidó su contraseña) — se documenta porque se pidió explícitamente, no porque explique el hotfix.

**Propuesta de solución:** Requiere diseño de producto antes de cualquier código (flujo de email transaccional, expiración de token, página de reset) — **no es parte de este hotfix**, es una funcionalidad nueva. Recomiendo tratarla como un ítem de backlog separado, después de resuelto el incidente crítico.

**Esfuerzo estimado:** Medio-Alto (requiere proveedor de envío de email transaccional — no until confirmado que el proyecto ya tenga uno integrado; no encontré ninguno en el código revisado).

---

## Resumen de severidad y esfuerzo

| # | Hallazgo | Tipo | Severidad | Esfuerzo | Explica el síntoma reportado |
|---|---|---|---|---|---|
| 1 | Case-sensitivity en login por email (y auto-login post-registro) | Código, confirmado | Alta | Trivial | Sí — "login por email no funciona correctamente" |
| 2 | Google OAuth "Acceso bloqueado" (redirect URI / NEXTAUTH_URL) | Externo, requiere verificación | Crítica | Bajo (una vez identificado) | Sí — coincide exactamente con el mensaje reportado |
| 3 | Variables de entorno faltantes/inconsistentes entre entornos | Externo, requiere verificación | Media-Alta | Bajo | Posible, contribuyente |
| 4 | Sin recuperación de contraseña | Código, confirmado (ausencia) | Alta (producto) | Medio-Alto | No — pedido aparte, no es causa del incidente |

## Orden recomendado de implementación

1. **Verificar manualmente Hallazgo #2** (Google Cloud Console + Vercel Production) — es la causa más probable del bloqueo de Google OAuth, y no requiere ningún cambio de código, solo de configuración. Esto debería desbloquear "Continuar con Google" de inmediato una vez corregido.
2. **Aplicar el fix de Hallazgo #1** (`.toLowerCase()` en `authorize()`) — cambio de código trivial, bajo riesgo, corrige el login por email de forma inmediata y verificable en minutos.
3. **Revisar Hallazgo #3** (paridad de variables entre Preview/Production, logs de la función `/api/auth`) — en paralelo a los 2 anteriores, ya que puede confirmar o descartar ambos con evidencia directa de los logs de Vercel.
4. **Recuperación de contraseña (Hallazgo #4)** — después de resuelto el incidente crítico, como ítem de backlog de producto separado (requiere decisión de diseño: proveedor de email, expiración de token, copy de las pantallas).

---

**No se realizó ningún cambio de código en esta auditoría**, por instrucción explícita. Quedo a la espera de aprobación para implementar el fix del Hallazgo #1 y de los resultados de la verificación manual de los Hallazgos #2 y #3 antes de proponer cualquier cambio de configuración externa.
