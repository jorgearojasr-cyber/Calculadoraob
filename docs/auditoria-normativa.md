# Auditoría normativa — ObraBien Calcula

Este documento registra qué contenido de la base de conocimiento está **citado con
fuente verificada** y qué es **práctica de obra general sin verificar** todavía, para
que quede claro qué puede mostrarse como "según norma X" y qué no.

Mecanismo: la tabla `norms` guarda cada fuente, con `verificationStatus`:

- `CITADO` — hay una norma o documento técnico identificado y su alcance está
  acotado a lo que realmente cubre.
- `PRACTICA_GENERAL_NO_VERIFICADA` — es un valor de uso habitual en obra (criterio
  de maestros/contratistas), no respaldado todavía por una norma o guía técnica
  específica.

`variables`, `formulas` y `loss_factors` tienen un `normId` opcional que apunta a la
fuente que los respalda. El componente `NormsDisclaimer`
(`src/components/module/norms-disclaimer.tsx`) lee las normas vinculadas al cálculo
de cada módulo y muestra la cita o la advertencia correspondiente en el resultado —
es reutilizable para cualquier módulo, no solo Radier.

## Módulo Radier — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Grado de hormigón por uso (G17/G20/G25, con equivalente H antiguo) | **Citado** | NCh170:2016 |
| Espesor de radier según uso (8/7/10/12 cm) | **No verificado** | Práctica de obra |
| Factor de pérdida de hormigón en vaciado (7%) | **No verificado** | Práctica de obra |
| Dosificación manual 1:2:3 (7 sacos cemento, 0.5 m³ arena, 0.75 m³ gravilla, 180 L agua por m³) | **No verificado** | Práctica de obra |

**Importante**: NCh170 clasifica y da requisitos generales del hormigón (nomenclatura
de grado, resistencia). **No regula** espesores de radier por uso arquitectónico ni
proporciones de dosificación manual — eso es criterio de obra/diseño, pertenece a otro
tipo de fuente (guías de diseño, OGUC, o experiencia de terreno) que todavía no hemos
verificado contra ningún documento específico. No se debe presentar el espesor ni la
dosificación como "según NCh170" — sería incorrecto.

### Lo que falta para que el grado quede 100% conforme a NCh170:2016

La norma vigente exige una **segunda letra** según el método de colocación del
hormigón: `N` (normal — capacho, descarga directa) o `B` (bombeado). Ejemplo: lo que
hoy mostramos como "G17" debería ser "G17-N" o "G17-B" según cómo se coloque. El
módulo Radier hoy no pregunta el método de colocación (solo pregunta si el hormigón
se compra premezclado o se prepara manualmente, que es un eje distinto), así que no
podemos completar ese sufijo sin inventar un dato. Queda pendiente como mejora futura:
agregar una pregunta de método de colocación si se quiere el código de grado completo.

## Tabla de equivalencia H → G (NCh170:2016)

Para referencia de otros módulos que usen grados de hormigón (Fundaciones, Muros,
Piscinas, etc.) — no hace falta volver a buscarla:

| Nomenclatura antigua (H, probeta cúbica 200mm) | Nomenclatura vigente (G, probeta cilíndrica 150×300mm) |
|---|---|
| H5 | G05 |
| H10 | G10 |
| H15 | G15 |
| H20 | G17 |
| H25 | G20 |
| H30 | G25 |
| H35 | G30 |
| H40 | G35 |
| H45 | G40 |
| H50 | G45 |

Es una equivalencia **aproximada por resistencia**, no una conversión exacta (los
métodos de ensayo — probeta cúbica vs. cilíndrica — dan valores distintos para el
mismo hormigón real). Al reutilizar esta tabla en otro módulo, mantener siempre el
formato "G-nuevo (equivalente al H-antiguo)" en el resultado, no reemplazar sin más:
en terreno todavía se pide el hormigón por su nombre antiguo.

## Módulo Pintura — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Rendimiento de pintura por tipo de superficie (10/8/9 m²/L) | **No verificado** | Práctica de obra |
| Rendimiento de sellador (12 m²/L) | **No verificado** | Práctica de obra |

Norma: `OBRA-PINTURA-RENDIMIENTOS`. Ningún rendimiento se cita contra una norma o
ficha técnica específica — depende del producto/fabricante real que se use en obra.

## Módulo Cerámica (pisos) — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Cobertura de caja de cerámica por tamaño (30x30→1.0, 45x45→1.35, 60x60→1.44 m²/caja) | **No verificado** | Práctica de obra / valor típico de mercado |
| Rendimiento de adhesivo (~4 m²/saco) | **No verificado** | Práctica de obra / valor típico de mercado |
| Factor de pérdida por corte (8% superficie simple, 15% superficie irregular) | **No verificado** | Práctica de obra |

Norma: `OBRA-CERAMICA-COBERTURA-PERDIDA`. Estos valores son típicos de mercado y
dependen del fabricante; no se citan como norma.

## Módulo Albañilería (muro de bloques/ladrillos) — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Unidades por m² y mortero por m² según tipo de unidad (ladrillo fiscal, bloque 15/20cm) | **No verificado** | Práctica de obra |
| Dosificación de cemento (14 bolsas/m³ de mortero) y arena (factor 1.1) | **No verificado** | Práctica de obra |
| Pérdida estándar de unidades (5%) | **No verificado** | Práctica de obra |

Norma: `OBRA-ALBANILERIA-RENDIMIENTOS`.

## Módulo Excavaciones — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Esponjamiento según tipo de terreno (25% tierra normal, 35% con arcilla o piedras) | **No verificado** | Práctica de obra |
| Capacidad aproximada de camión tolva chico (6 m³) | **No verificado** | Práctica de obra / varía por proveedor |

Norma: `OBRA-EXCAVACION-ESPONJAMIENTO`.

## Módulo Fierros (enfierradura) — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Pesos teóricos de barra por diámetro (6/8/10/12mm) | **No verificado contra norma chilena específica** | Dato físico de fabricación, razonablemente universal |
| Largo comercial de barra (6m) | **No verificado** | Práctica común |

Norma: `OBRA-FIERROS-PESO-TEORICO`. Este módulo **no diseña** especificación
estructural (no decide diámetro, cantidad ni traslapo) — solo convierte una
especificación que el usuario ya tiene (de un plano o profesional) a cantidad
de material. El disclaimer de este módulo incluye una frase explícita
reforzando que la enfierradura es un elemento estructural y su especificación
debe provenir siempre de un profesional habilitado.

## Módulo Techumbres (cubierta) — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Cobertura útil y pérdida por tipo de cubierta (zinc 2.7m²/10%, tejuela 3.1m²/10%, teja arcilla 0.0625m²/5%) | **No verificado** | Práctica de obra / valor típico de mercado |
| Factor de conversión área horizontal → área real por inclinación (1.03/1.15/1.30) | **No verificado** | Aproximación geométrica estándar, no cálculo trigonométrico exacto |

Norma: `OBRA-TECHUMBRE-COBERTURAS`.

## Módulo Yeso Cartón (tabiques y cielos) — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Pérdida por corte (10%), plancha comercial 1.20x2.40m (2.88 m²) | **No verificado** | Práctica de obra |
| Rendimiento de tornillos (12/m²) y caja estándar (1000 unidades) | **No verificado** | Práctica de obra |

Norma: `OBRA-YESOCARTON-RENDIMIENTOS`.

## Módulo Paisajismo (pasto en panes) — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Pérdida por recortes/ajustes al instalar pasto (5%) | **No verificado** | Práctica de obra |
| Espesor típico de capa de tierra de hoja (5cm) | **No verificado** | Práctica de obra |

Norma: `OBRA-PAISAJISMO-PASTO`. Alcance acotado a UN sub-caso (pasto en panes/placas)
— siembra por semilla y riego quedan como módulos separados a futuro.

## Módulo Piscinas (rectangular, hormigón armado) — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Espesor típico de muro/losa de piscina (0.20m) | **No verificado** | Práctica de obra |
| Cobertura y pérdida por revestimiento (cerámica 1.35m²/10%, membrana PVC 1m²/5%) | **No verificado** | Práctica de obra / valor típico de mercado |
| Caudal de filtro sugerido (volumen de agua en 8 horas) | **Orientativo, no verificado** | La bomba y filtro reales deben dimensionarse con el proveedor del equipo |

Norma: `OBRA-PISCINA-DIMENSIONAMIENTO`. Alcance acotado a piscinas
**rectangulares** en hormigón armado in situ — no cubre piscinas circulares,
formas libres, ni fibra de vidrio prefabricada (esa última se cotiza directo
con el proveedor y no encaja en este tipo de cálculo).

## Módulo Quinchos (estructura y techo) — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Espaciamiento de postes (2m o 3m según preferencia) | **No verificado** | Práctica de obra |
| Pérdida por corte de vigas (10%) y tramo comercial (3m) | **No verificado** | Práctica de obra |
| Inclinación de techo asumida fija (factor 1.15) | **Simplificación, no verificado** | No se pregunta al usuario, a diferencia de Techumbres |
| Cobertura y pérdida de cubierta | **No verificado** | Mismos valores que Techumbres |

Norma: `OBRA-QUINCHO-ESTRUCTURA`. Alcance acotado a estructura de postes +
techo — no incluye piso/pavimento (queda para una iteración futura).

## Módulo Impermeabilización — estado actual

| Contenido | Estado | Fuente |
|---|---|---|
| Cobertura y pérdida de membrana asfáltica (10m²/rollo, 15%) | **No verificado** | Práctica de obra / valor típico de mercado |
| Cobertura y pérdida de pintura impermeabilizante (4m²/galón ya con 2 manos, 5%) | **No verificado** | Práctica de obra / valor típico de mercado |

Norma: `OBRA-IMPERMEABILIZACION-RENDIMIENTOS`. Los materiales (rollos vs.
galones) son mutuamente excluyentes según el tipo de impermeabilizante
elegido — nunca aparecen ambos en el mismo resultado.

## Cómo se implementó

- **Schema** (`prisma/schema.prisma`): modelo `Norm` (`code`, `title`, `year`, `scope`,
  `verificationStatus`, `note`) con relaciones opcionales desde `Variable`, `Formula`
  y `LossFactor` (`normId`).
- **Mostrar texto en el resultado**: las fórmulas del motor solo evalúan a números
  (ver `docs/formula-dsl.md`), así que un valor de texto derivado como "tipo de
  hormigón recomendado" no encajaba en `results`. Se agregó `Variable.isResult`
  (mismo patrón que `Formula.isResult`): si es `true`, el valor resuelto de esa
  variable se expone en `infoResults` y el `ResultScreen` lo muestra como una tarjeta
  informativa antes de las cantidades de materiales.
- **Motor** (`src/lib/formula-engine/index.ts`): `calculateModule` ahora también
  retorna `infoResults`.
- **Server action** (`src/app/categorias/[slug]/[moduleSlug]/actions.ts`):
  `calculateModuleAction` incluye las normas de todas las variables/fórmulas/factores
  de pérdida del módulo (`norms`), deduplicadas por id.
- **UI**: `src/components/module/norms-disclaimer.tsx` — no renderiza nada si el
  módulo no tiene normas vinculadas; si tiene, separa citas (`CITADO`) de advertencias
  (`PRACTICA_GENERAL_NO_VERIFICADA`). Se usa tanto en el wizard público como en la
  Vista previa del admin (mismo componente `ResultScreen`).
- **Datos**: `prisma/seed-radier.ts` crea los dos registros de `Norm` y vincula cada
  variable/fórmula/factor de pérdida correspondiente. Correrlo (`npx prisma db seed`)
  actualiza tanto el seed como los datos ya cargados en la base — es la forma
  sancionada de actualizar contenido sin tocar código de aplicación (ver
  `decisiones-tecnicas.md`).

## Limitación conocida (para la próxima sesión)

Hoy **no existe UI de admin** para crear/vincular normas — el CRUD de `norms` se
maneja solo por seed/script. Si se quiere que un admin no técnico pueda citar una
norma nueva o vincularla a una variable/fórmula/factor de pérdida sin tocar código,
falta construir esa pantalla (probablemente un tab "Normas" en
`/admin/modulos/[id]`, más un picker de norma en los formularios de Variables y
Fórmulas). No se construyó en esta sesión porque no fue parte del pedido explícito.

## Pendiente de verificar (no inventar, solo marcar)

- Espesor de radier por uso — sin fuente identificada.
- Factor de pérdida 7% — sin fuente identificada.
- Dosificación manual 1:2:3 — sin fuente identificada.

Si en el futuro se encuentra una guía técnica u OGUC que respalde alguno de estos
valores, el cambio es: crear/actualizar el registro en `norms` con
`verificationStatus: CITADO` y la fuente real, y vincularlo — sin tocar la lógica de
cálculo.
