# Pendiente: `decisionKey` — decisión compartida entre fases de un plan

**Estado: NO aprobado, NO implementado.** Este documento existe para no perder
el diseño ya conversado, y para dejar el working tree limpio mientras se
decide si se retoma. Ver hilo de sesión del 2026-07-29 (piscinas / excavación
circular) para el contexto completo.

## Problema que resuelve

Hoy los links módulo→fase (`ProjectPlanPhaseModule`) son todos "opciones
alternativas" sin tipo. Pero hay 2 clases distintas:

- **(a) Decisión compartida y excluyente**: Rectangular/Circular en la Fase 1
  ("Excavar el hoyo") y la Fase 2 ("Construir la piscina") del plan
  `construir-una-piscina` son la MISMA decisión, contestada una vez, que
  debería aplicar a ambas fases — hoy se preguntan por separado, sin
  propagarse, y el usuario puede terminar calculando una excavación
  rectangular para una piscina que va a construir circular (o viceversa).
- **(b) Menú independiente**: Pastelones/Sendero en la Fase 3 ("Terminar el
  entorno") son alternativas libres, no ligadas a nada — podrían usarse las
  dos, no son excluyentes.

## Diseño conversado (no implementado)

### Schema

- `ProjectPlanPhaseModule` gana 2 campos opcionales:
  - `decisionKey String?` — ej. `"forma-piscina"`. Null = menú libre
    (comportamiento actual, sin cambios).
  - `optionKey String?` — ej. `"rectangular"` / `"circular"`. Identifica qué
    opción de ese `decisionKey` representa este link.
- Nuevo modelo `ProjectPlanDecision` (persistencia POR USUARIO, no global):
  ```prisma
  model ProjectPlanDecision {
    id          String   @id @default(cuid())
    user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
    userId      String
    plan        ProjectPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
    planId      String
    decisionKey String
    optionKey   String

    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@unique([userId, planId, decisionKey])
    @@index([userId])
    @@map("project_plan_decisions")
  }
  ```
  (Requiere también agregar `decisions ProjectPlanDecision[]` a `User` y a
  `ProjectPlan`.)

### Datos (una vez implementado el schema)

- Fase 1: `excavacion` → `decisionKey: "forma-piscina"`, `optionKey: "rectangular"`;
  `excavacion-circular` → `"forma-piscina"` / `"circular"`.
- Fase 2: `piscina-rectangular-hormigon-armado` → `"forma-piscina"` /
  `"rectangular"`; `piscina-circular-hormigon-armado` → `"forma-piscina"` /
  `"circular"`.
- Fase 3: sin `decisionKey` (comportamiento actual, menú libre).

### Comportamiento en `/plan/[slug]`

- Sin sesión: comportamiento actual sin cambios (nunca puede persistir una
  decisión, así que las fases con `decisionKey` siguen mostrando ambas
  opciones siempre).
- Con sesión, decisión NO resuelta: la fase muestra el encabezado "¿Tu
  piscina va a ser?" + las opciones como BOTONES (no links directos) — al
  hacer click se llama a una server action que persiste la decisión y
  re-renderiza (sin navegar todavía al wizard).
- Con sesión, decisión resuelta: la fase muestra solo el link que
  corresponde a la opción elegida ("Calcular esta fase", como hoy con 1 solo
  link) + un link secundario discreto "Cambiar forma" que vuelve a mostrar
  el picker de 2 opciones (sin persistir nada hasta que se elija de nuevo).
- Cambiar de decisión con fases ya completadas: **NO** resetea
  `ProjectPlanPhaseCompletion` en silencio. Se muestra un aviso tipo
  "Cambiaste la forma a circular — revisa la Fase 1, la calculaste como
  rectangular", calculado en el server action comparando la decisión previa
  vs. la nueva y listando las fases de ese `decisionKey` que ya estén
  completadas.
- Fase 3 (sin `decisionKey`): sin cambios, menú libre como siempre.

### Server action nueva

`setPlanDecisionAction(planId, planSlug, decisionKey, optionKey)`:
1. Sin sesión → no-op (retorna `{}`, el cliente no fuerza login — a
   diferencia de `togglePhaseCompletionAction`, elegir la forma de la
   piscina no debería exigir cuenta).
2. Con sesión: buscar decisión previa (si existe y difiere de la nueva),
   buscar fases de ese plan+`decisionKey` que estén completadas
   (`ProjectPlanPhaseCompletion`), armar el mensaje de aviso si aplica.
3. `upsert` de `ProjectPlanDecision`.
4. `revalidatePath('/plan/[slug]')`.
5. Retornar `{ warning?: string }`.

## Por qué se parqueó

Pedido explícito: "no está aprobada y va después de la grilla del diagrama
3D" — más 3 rondas pidiendo confirmar que no se había retomado. El
`schema.prisma` llegó a tener los 2 campos de `ProjectPlanPhaseModule`
editados sin commitear (nunca se generó migración, nunca se aplicó contra
Neon) — se restauró a `origin/master` el 2026-07-29 para dejar el árbol
limpio mientras se decide.

## Para retomar

1. Reaplicar el diff de schema (arriba) + el modelo `ProjectPlanDecision`
   completo + las relaciones en `User`/`ProjectPlan`.
2. `npx prisma migrate dev --name add_plan_decision`.
3. Script de contenido para setear `decisionKey`/`optionKey` en los 4 links
   de Fase 1/Fase 2 del plan de piscina.
4. Nueva server action `setPlanDecisionAction` en
   `src/app/(app)/plan/[slug]/actions.ts`.
5. Actualizar `PlanPhaseData`/`PlanView` (`src/components/plan/plan-view.tsx`)
   para el picker con botones, el link "Cambiar forma", y el banner de aviso.
6. Verificación pedida originalmente:
   - Plan nuevo: Fases 1 y 2 muestran ambas opciones.
   - Elegir "Circular" en Fase 1 → Fase 2 muestra solo Circular + "Cambiar forma".
   - "Cambiar forma" a Rectangular con Fase 1 ya completada → aparece el
     aviso, no se borra la completitud.
   - Fase 3 sigue mostrando Pastelones y Sendero, sin cambios.
