# FASE 11AR — Cierre técnico y editorial de Cubierta de Baño

Fase de auditoría + fuentes + diseño + redacción técnica. Sin cambios de código, Prisma, BD, catálogo, seed, TechnicalArticles en BD, commit, push ni deploy. Último componente especial pendiente de Baño V1.

## A. Objetivo

Cerrar definitivamente Cubierta de baño — el octavo y último componente especial identificado en esta serie, declarado necesario por 11AQ tras revertir la conclusión preliminar de 11AJ — y confirmar si con este cierre Baño V1 queda listo para consolidación arquitectónica y planificación de lotes.

## B. Estado en 11AQ

[FASE11AQ_CIERRE_TECNICO_MUEBLE_BANO.md](FASE11AQ_CIERRE_TECNICO_MUEBLE_BANO.md) §K/§AM es la fuente de verdad inmediata — no se reabre la pregunta de independencia, ya demostrada con una matriz de 6 escenarios reales (secciones E y F mostrando evidencia concreta de independencia: mueble de obra + cubierta de piedra con daños independientes; cubierta/repisa sin mueble inferior). De 11AQ se extrae sin reabrir: key candidata `cubierta-bano`, Nivel 2 Sí/No, sección **ARTEFACTOS SANITARIOS** (junto a WC/Lavamanos/Ducha/Tina/Mampara/Mueble — no EQUIPAMIENTO DEL RECINTO, corrigiendo la sugerencia del enunciado de esta fase, que en su sección 7 proponía esa sección citando "junto a Mueble de baño/Vanitorio" sin notar que Mueble mismo vive en ARTEFACTOS SANITARIOS, no en EQUIPAMIENTO DEL RECINTO — 11AQ es la fuente canónica y manda), `order` conceptual 21, frontera con Lavamanos ya resuelta (Lavamanos conserva su propio sello lavamanos-cubierta/muro inmediato al artefacto; Cubierta evaluaría el resto del perímetro contra el muro), frontera con Mueble ya resuelta (Mueble no revisa ningún aspecto de la superficie de la cubierta), checks candidatos preliminares (daños, fijación/nivelación observable, sello con el muro — 2-4 checks estimados sin comprometer cifra final), requiere cierre técnico específico — exactamente lo que esta fase entrega.

## C. Precedente Cubierta de Cocina

Releído íntegro el `cubierta-meson` de Cocina (auditoría directa de BD, sección D). Sus 2 checks finales:
1. **Fijación** (MEDIUM): "¿La cubierta o mesón se ve firme y bien fijada, sin moverse al tocarla?" — 🟡 criterio interno, con nota explícita: *"El Manual de Tolerancias (cap. 22) da solo la horizontalidad dimensional de la superficie (1 mm por metro lineal, verificable con nivel), no un criterio de fijación."*
2. **Daños + Sello con muro, combinados** (LOW): "¿La cubierta presenta daños visibles o separaciones/grietas en el encuentro con el muro?" — 🟡 criterio interno, con nota explícita: *"El Manual de Tolerancias (cap. 22) no menciona sellos ni encuentros cubierta-muro — el criterio del sello es una analogía con el ya usado en Ventana (sello marco-muro), declarada explícitamente como criterio interno, no como respaldo del Manual de Cocina."*

Usado como **precedente de método y de fuente**, no copiado automáticamente — esta fase evalúa explícitamente (sección Y) si Baño justifica separar Daños de Sello (que en Cocina van combinados), dado el contexto adicional de zona húmeda y el nuevo encuentro con Lavamanos que Cocina nunca tuvo que resolver.

## D. Catálogo (auditoría solo lectura, esta fase)

Confirmado disponible: `cubierta-bano`, `cubierta-vanitorio`, `cubierta-lavamanos`, `meson-bano` — **las 4 keys están libres**. `cubierta-meson` de Cocina confirmado: `order: 17`, `materialVariantOf: null`, `active: true`, 2 checks (sección C).

## E. Definición del componente

`cubierta-bano` representa: una **superficie fija** asociada habitualmente a Lavamanos y/o Mueble de baño/Vanitorio, de material potencialmente distinto al cuerpo del mueble (piedra, cuarzo, cerámica, madera, MDF revestido, u otro) — puede existir con Mueble, sin Mueble (escenario F, sección F), con Lavamanos, o incluso antes de que un Lavamanos esté instalado (obra fija completada por adelantado). **No representa**: el cuerpo del Mueble (componente independiente, 11AQ), el Lavamanos, su grifería ni su sifón (componente independiente, 11AM), espejo ni accesorios (descartados de V1, 11AJ).

## F. Escenarios reales — validación final

Revalidados contra los 3 componentes ya independientes (Lavamanos / Mueble / Cubierta), mismos escenarios ya usados en 11AQ §AL, confirmando representabilidad sin dependencia falsa:

- **A. Lavamanos pedestal**: Lavamanos Sí, Mueble No, Cubierta No. ✅
- **B. Lavamanos suspendido**: Lavamanos Sí, Mueble No, Cubierta No (o Sí si existe una repisa de apoyo diferenciable). ✅
- **C. Lavamanos integrado en cubierta prefabricada**: Lavamanos Sí, Cubierta No (la "cubierta" es la misma pieza moldeada que el lavamanos, sin superficie diferenciable que activar — mismo razonamiento que 11AQ aplicó al caso equivalente con Mueble). ✅
- **D. Lavamanos sobrepuesto sobre cubierta**: Lavamanos Sí, Cubierta Sí (pieza física distinta y diferenciable). ✅
- **E. Cubierta + Mueble inferior**: Mueble Sí, Cubierta Sí, ambos con checks propios sin overlap (frontera ya resuelta en 11AQ). ✅
- **F. Cubierta de obra sin mueble inferior**: Mueble No, Cubierta Sí — el escenario que forzó la corrección arquitectónica de 11AQ. ✅

Los 6 escenarios se representan sin mentira, sin activaciones falsas y sin duplicidad de hallazgos, confirmando que la arquitectura de 3 componentes independientes (Lavamanos/Mueble/Cubierta) es completa.

## G. Nivel 2

**Decisión: Nivel 2 (configurable), confirmando 11AQ §AM sin reabrir.**

## H. Pregunta y sección

**Pregunta confirmada, simplificada respecto al wording candidato de 11AQ**: **"¿El baño tiene cubierta o mesón instalado?"** — se descarta el calificador adicional que 11AQ había propuesto como candidato ("...de material distinto al mueble, como piedra, cuarzo o similar") por ser innecesariamente largo para una pregunta Sí/No — la distinción de si la cubierta es o no una pieza diferenciable del mueble/lavamanos ya la resuelve el sentido común del usuario al responder (si no hay una superficie distinguible, responde "No"), sin necesitar que la pregunta misma cargue esa explicación. Mismo criterio de brevedad ya aplicado en toda la serie (Ventana, Puerta, Ducha, Tina — preguntas cortas, sin explicar casos límite en el propio texto).

**Sección: ARTEFACTOS SANITARIOS** (confirmado, corrigiendo la sugerencia de EQUIPAMIENTO DEL RECINTO del enunciado — sección B). **`order`: 21** (confirmado, después de Mueble de baño en 20).

## I. Independencia de Mueble

**Regla canónica confirmada, sin dependencia automática en ninguna dirección**: Mueble Sí ≠ Cubierta Sí; Cubierta Sí ≠ Mueble Sí. Ambos son componentes Nivel 2 independientes, cada uno con su propio Sí/No — ningún componente derivado basado en el estado del otro. Ya demostrado con evidencia de casos reales en 11AQ (escenarios E/F), no reabierto aquí.

## J. Independencia de Lavamanos

**Confirmado, responsabilidades distintas sin overlap**: Lavamanos revisa cubeta, grifería, agua fría/caliente, fugas, fijación del artefacto y su propio sello (lavamanos-cubierta/muro inmediato, 11AM §P) — Cubierta revisa la superficie en sí, su fijación propia, sus daños, y su encuentro con el muro en el resto del perímetro (fuera del borde inmediato del lavamanos). Ninguno de los dos revisa la misma junta como dos hallazgos distintos (tabla completa en sección K).

## K. Frontera de sellos (tabla obligatoria)

| Encuentro | Responsable | Check |
|---|---|---|
| Lavamanos ↔ Cubierta/muro (borde inmediato del artefacto) | **Lavamanos** | `lavamanos-sello-perimetral` (11AM), ya cerrado, no reabierto |
| Cubierta ↔ Muro (resto del perímetro, fuera del borde del lavamanos) | **Cubierta** | Sello cubierta-muro (sección N, nuevo en esta fase) |
| Mueble ↔ Cubierta (encuentro estructural entre el cuerpo del mueble y la cara inferior de la cubierta) | **Ninguno como check propio** | No es un encuentro típicamente sellado con silicona visible (la cubierta se apoya o se fija estructuralmente al mueble, no se seca) — si la cubierta no está bien asentada, eso se manifiesta como movimiento en el check de Fijación de Cubierta (sección L), no como un "sello" faltante |
| Cubierta ↔ Cubierta (juntas entre piezas, en instalaciones de más de una pieza) | **Cubierta**, folded dentro de Daños visibles (sección O) | Sin check propio — ver sección R |

**Confirmado sin ambigüedad**: ninguna junta física se revisa dos veces por dos componentes distintos.

## L. Fijación / estabilidad

Check final confirmado. Wording: **"¿La cubierta o mesón se ve firme y bien instalada, sin movimiento evidente al tocarla suavemente?"** — reutiliza el concepto (no el template) del precedente de Cocina, con wording ampliado para cubrir explícitamente las 4 variantes de instalación mencionadas en el enunciado: apoyada en mueble, empotrada, de obra, o suspendida — el wording genérico ("se ve firme... al tocarla suavemente") ya aplica sin distinción a las 4, sin necesitar mencionarlas explícitamente en el texto de la pregunta (mismo criterio de brevedad de la sección H). Método: contacto leve únicamente — explícitamente prohibido apoyarse, cargar peso o empujar fuerte (mismo nivel de cuidado que el precedente de Cocina). `defaultSeverity`: `MEDIUM` — mismo nivel que Cocina, sin cambio, porque el riesgo real (cubierta mal fijada, riesgo de desprendimiento) no varía por estar en Baño en vez de Cocina.

## M. Daños visibles

Check final confirmado, con alcance ampliado respecto al precedente de Cocina para cubrir de forma material-agnóstica las señales de deterioro que Cocina no necesitó considerar tan explícitamente (secciones O/P/Q/R analizadas en conjunto). Wording: **"¿La cubierta presenta golpes, quiebres, trizaduras, rayas profundas, manchas, hinchamiento u otro deterioro o daño visible?"** — deliberadamente material-agnóstico: no presupone piedra (trizaduras), MDF revestido (hinchamiento) ni ningún material específico — el wording lista varias manifestaciones posibles sin exigir que todas apliquen, dejando que el usuario reporte la que efectivamente observe en su material real. `defaultSeverity`: `LOW` — mismo nivel que Cocina, defecto cosmético/de calidad sin riesgo funcional inmediato (a diferencia de Mampara-Daños visibles, que sí llegó a HIGH por el riesgo de vidrio — aquí no existe ese riesgo de corte, y se mantiene el nivel del precedente de Cocina).

## N. Encuentro cubierta / muro — decisión de separar del check de Daños (a diferencia de Cocina)

**Decisión: check final propio, independiente de Daños visibles — separado del patrón combinado de Cocina, con justificación explícita.**

Análisis de por qué Baño diverge de Cocina en este punto: en Cocina, Daños y Sello-con-muro se combinaron en 1 solo check. Aplicando el mismo tipo de análisis de solapamiento usado en toda esta serie (¿misma foto/comentario/reparación?): un daño de superficie (una trizadura en medio de la cubierta) y una separación en el sello con el muro (en el borde) son observables en **ubicaciones físicas distintas**, con **acciones de reparación distintas** (reparar/reemplazar la pieza vs. resellar el borde) — no es la misma evidencia. Se justifica separarlos aquí, a diferencia de Cocina, por 2 razones adicionales propias de Baño: (1) el contexto de zona húmeda hace que el estado del sello tenga una consecuencia funcional más directa (paso de agua hacia el muro) que en Cocina, mereciendo un seguimiento propio con su propia severidad; (2) con Lavamanos ahora teniendo su propio sello (11AM), mantener el de Cubierta como check independiente da consistencia visual al catálogo — todos los componentes sanitarios de Baño que tienen un encuentro sellable (Lavamanos, Ducha, Tina, Mampara, y ahora Cubierta) lo revisan como check propio, no combinado con daños. Wording: **"El sello entre la cubierta y el muro (en el tramo que no corresponde al Lavamanos) se ve continuo, sin separaciones ni grietas?"** — aclara explícitamente que no duplica el sello de Lavamanos (frontera de la sección K). No exige un material de sellado específico (silicona u otro). `defaultSeverity`: `MEDIUM` — mismo nivel que el resto de sellos del catálogo de Baño (Lavamanos, Ducha, Tina, Mampara).

## O. Humedad / deterioro

**Confirmado: folded dentro de Daños visibles (sección M), sin check propio.** Ver wording ya ampliado en la sección M ("manchas, hinchamiento u otro deterioro") — cubre exactamente lo que este candidato pedía, sin duplicar. No se crea un check específico de "hinchamiento" porque solo aplicaría a materiales tipo MDF revestido, dejando el check inaplicable (con N/A forzado) para cubiertas de piedra/cuarzo/cerámica — mismo tipo de problema que el enunciado advertía evitar explícitamente ("no diseñar un check específico de 'hinchamiento' que solo aplica a ciertos materiales").

## P. Manchas

**Confirmado: folded dentro de Daños visibles (sección M/O), sin check propio.** Una mancha, cuando representa una alteración evidente del material (no simple suciedad removible con limpieza normal), ya queda cubierta por el wording ampliado de Daños visibles. No se crea un check cosmético separado sin valor diferenciador.

## Q. Deformación

**Confirmado: folded dentro de Daños visibles (sección M), no dentro de Fijación.** Análisis de solapamiento: una cubierta arqueada o vencida es, para el usuario, una observación del **estado visible del material** (mismo tipo de evidencia que un daño), distinta de Fijación, que evalúa **movimiento al tocar** — una cubierta puede estar deformada y aun así sentirse firme al tacto (o viceversa). Se incluye "deformación" implícitamente dentro del alcance amplio de "otro deterioro visible" de Daños visibles, sin necesitar nombrarla explícitamente en el wording (ya cubierta por su generalidad).

## R. Juntas entre piezas

**Confirmado: folded dentro de Daños visibles (sección M), sin check propio ni tolerancia dimensional inventada.** Una junta abierta o mal alineada entre 2 piezas de cubierta es observable como el mismo tipo de "daño o deterioro visible" que el check ya cubre — no se crea un check separado que exigiría una tolerancia de desnivel/separación en mm sin fuente ni instrumento disponible (mismo razonamiento que descartó Alineación de Mueble en 11AQ §S).

## S. Material

**Confirmado: sin metadata.** No se pregunta piedra/cuarzo/granito/porcelanato/melamina/madera ni ningún material — ninguno de los 3 checks finales (Fijación, Daños, Sello) cambia según el material; el wording de Daños ya es explícitamente material-agnóstico (sección M). El checklist es completamente independiente del material real de la cubierta.

## T. Nivelación / horizontalidad

**Decisión: DESCARTADO, confirmado sin repetir el error de 11Z.** Releída la nota explícita del propio artículo legacy de Cocina (sección C): el Manual cap. 22 da una tolerancia de horizontalidad (1 mm por metro lineal) que **requiere nivel** para verificarse — ninguna revisión visual puede confirmarla de forma objetiva. No se presenta ninguna inspección visual como verificación de esa tolerancia normativa. Un check subjetivo tipo "¿se ve inclinada?" se descarta explícitamente por ser demasiado subjetivo sin instrumento, tal como el enunciado anticipaba.

## U. Agua acumulada sobre la cubierta

**Decisión: DESCARTADO, confirmado.** Depende de geometría, uso y nivelación de forma indistinguible para el usuario — no se realiza una prueba vertiendo agua deliberadamente sobre la superficie (sería una prueba artificial e innecesaria, mismo criterio ya aplicado repetidamente en esta serie para pruebas invasivas sin método seguro claro).

## V. Bordes / cantos

**Confirmado: folded dentro de Daños visibles (sección M), sin check independiente.** Un canto dañado ya es un tipo de daño visible cubierto por el wording amplio del check.

## W. Matriz de candidatos

| Candidato | Defecto | ¿Aplica a todas? | Método | Fuente | Solapa con | ¿Merece estado? | Decisión |
|---|---|---|---|---|---|---|---|
| 1. Fijación/estabilidad | Movimiento al tocar | Sí | Tocar suave | 🟡 criterio interno | Ninguno | Sí | **MANTENER** |
| 2. Daños visibles | Golpe/quiebre/trizadura/raya | Sí | Observar | 🟡 criterio interno | Con #5/#6/#7/#8/#11 | Sí | **MANTENER**, alcance ampliado |
| 3. Encuentro cubierta-muro | Separación/grieta en el sello | Sí, fuera del borde de Lavamanos | Observar | 🟡 criterio interno (analogía) | Con #4 (es el mismo concepto) | Sí | **MANTENER**, check "Sello", separado de Daños (a diferencia de Cocina) |
| 4. Sellos | (mismo que #3) | — | — | — | Con #3 | — | **FUSIONADO en #3** desde el inicio (un solo concepto, 2 nombres del enunciado) |
| 5. Humedad/deterioro | Manchas/hinchamiento/deterioro | Solo según material | Observar | 🟡 criterio interno | Con #2 | No — mismo tipo de defecto, wording material-específico problemático | **FOLD** en #2, ampliando su wording |
| 6. Manchas | Alteración visible | Sí, cuando ocurre | Observar | — | Con #2/#5 | No | **FOLD** en #2 |
| 7. Deformación | Arqueo/vencimiento | Sí, cuando ocurre | Observar | — | Con #2 (no con #1) | No | **FOLD** en #2 |
| 8. Juntas | Separación/desnivel entre piezas | Solo si hay más de 1 pieza | Requeriría instrumento para objetividad | Sin fuente | Con #2 | No — sin tolerancia sin instrumento | **FOLD** en #2 |
| 9. Nivelación | Horizontalidad fuera de tolerancia | Sí | Requiere nivel | Manual cap. 22, requiere instrumento | — | No | **DESCARTAR** |
| 10. Agua acumulada | Agua no drena de la superficie | Sí | Requeriría prueba invasiva | Sin fuente ni método simple | — | No | **DESCARTAR** |
| 11. Borde/canto | Daño en el borde | Sí, cuando existe daño | Observar | — | Con #2 | No | **FOLD** en #2 |

**Ningún candidato queda sin decisión.**

## X. Matriz de solapamiento (análisis dirigido)

| Comparación | ¿Producirían misma foto/comentario/reparación? | Decisión |
|---|---|---|
| Daños vs. Humedad | Sí — mismo tipo de evidencia visual del material | **Fusionados** en Daños ampliado |
| Daños vs. Deformación | Sí — ambas son observaciones del estado visible del material, distintas de Fijación (que es sobre movimiento al tacto) | **Fusionados** en Daños; distinguidos explícitamente de Fijación |
| Encuentro muro vs. Sello | Mismo concepto nombrado dos veces en el enunciado (secciones 13 y 22) | **Un solo check** |
| Fijación vs. Deformación | No — Fijación es movimiento al tacto, Deformación es estado visible del material; pueden coexistir sin ser el mismo hallazgo (una cubierta puede estar deformada y firme, o dañada y firme) | **Mantenidos conceptualmente distintos**, Deformación folded en Daños, no en Fijación |
| Juntas vs. Daños | Sí — mismo tipo de evidencia visual, sin tolerancia dimensional disponible | **Fusionados** |
| Cubierta-Sello vs. Lavamanos-Sello | Ubicaciones físicas distintas del perímetro (borde inmediato del lavamanos vs. resto del encuentro con el muro) — frontera ya cerrada en 11AM, confirmada en sección K | **Sin overlap** |
| Cubierta vs. Mueble-Humedad | Síntomas en componentes físicamente distintos (superficie de la cubierta vs. material del cuerpo del mueble) — pueden coexistir sin relación de causalidad automática (sección Y) | **Sin overlap, coexistencia posible sin duplicar** |

## Y. Relación con Humedad del Mueble — regla de no-causalidad automática

Confirmado explícitamente (resolviendo la sección 23 del enunciado): si Cubierta presenta un sello abierto (check de la sección N) y, en el mismo baño, Mueble de baño presenta humedad/hinchamiento (11AQ §P), son **dos síntomas distintos, registrados en dos componentes distintos**, sin que la app afirme una relación de causa-efecto entre ambos — ninguna guía de esta fase escribe, ni implica, "el sello causó el mueble hinchado" o frase equivalente. Ambos hallazgos pueden coexistir en el mismo informe como observaciones independientes, cada una con su propia evidencia — igual criterio de coexistencia sin causalidad ya usado entre Lavamanos-Fugas y Mueble-Humedad (11AQ §P/W).

## Z. Revisiones finales

**3 checks**, en el extremo superior del rango orientativo (2-4), un check más que el precedente de Cocina (2), justificado explícitamente (no por simetría): la separación de Sello respecto de Daños, a diferencia del patrón combinado de Cocina, se sustenta en el análisis de solapamiento de la sección N/X, no en una preferencia de diseño:

1. **Fijación** — "¿La cubierta o mesón se ve firme y bien instalada, sin movimiento evidente al tocarla suavemente?"
2. **Daños visibles** — "¿La cubierta presenta golpes, quiebres, trizaduras, rayas profundas, manchas, hinchamiento u otro deterioro o daño visible?"
3. **Sello cubierta-muro** — "El sello entre la cubierta y el muro (en el tramo que no corresponde al Lavamanos), ¿se ve continuo, sin separaciones ni grietas?"

## AA. Fuentes

Los 3 checks: **🟡 CRITERIO INTERNO**, sin excepción. Fijación y Sello reutilizan el mismo nivel de fuente que su precedente en Cocina (criterio interno puro, con Sello por analogía a Ventana/otros sellos del catálogo). Ninguna clasificación 🟢 ni 🟢/🟡. Ninguna analogía elevada a fuente normativa.

## AB. Manual de Tolerancias

Confirmado con precisión, reutilizando la lectura íntegra de 11V/11AC/precedente Cocina: el cap. 22 (Muebles, que incluye cubiertas/mesones incorporados) da una tolerancia de horizontalidad de superficie (1 mm por metro lineal), **verificable únicamente con nivel** — no una tolerancia de fijación, no de daños, no de sellos. Ningún check final de esta fase se atribuye al Manual — los 3 quedan 🟡, sin afirmar "cumple tolerancia" sin medición real. Mismo hallazgo exacto que confirmó Cocina, sin diferencia por estar en Baño.

## AC. Severidades

- **Fijación**: `MEDIUM` — mismo nivel que el precedente de Cocina, sin cambio.
- **Daños visibles**: `LOW` — mismo nivel que el precedente de Cocina, sin cambio.
- **Sello cubierta-muro**: `MEDIUM` — nuevo check (no existía combinado con Daños como en Cocina, donde el combinado quedó en LOW); se le asigna MEDIUM, consistente con el resto de checks de sello del catálogo de Baño (Lavamanos, Ducha, Tina, Mampara, todos MEDIUM), reflejando la consecuencia funcional más directa de un sello roto en zona húmeda (paso de agua hacia el muro) frente al defecto puramente cosmético de Daños.

Sin homogeneizar. Recordatorio explícito: DT-01 sigue sin corregirse.

## AD. Seguridad

**Permitido**: observar, tocar suavemente, mirar encuentros y cantos.

**Prohibido, confirmado en las 3 guías**: subirse a la cubierta, sentarse sobre ella, cargar peso, moverla, desmontarla, retirar el Lavamanos o el Mueble para revisarla mejor, intervenir sellos, usar herramientas.

## AE. Guías completas

### `cubierta-bano-fijacion`

```
# Qué revisar

Si la cubierta o mesón se ve firme y bien instalada, sin movimiento evidente al tocarla suavemente.

# Cómo revisarlo

Toca la cubierta suavemente con la mano en distintos puntos, especialmente cerca de los bordes y las uniones con el mueble o el muro. No te apoyes con tu peso ni apliques fuerza.

# Qué debería verse

La cubierta no se mueve ni se balancea al tocarla levemente, y no hay separación visible entre la cubierta y su soporte (mueble, muro u obra).

# Qué señales pueden indicar un problema

- La cubierta se mueve o cede al presionarla suavemente.
- Se ve una separación entre la cubierta y su soporte.

# Por qué importa

Una cubierta mal fijada puede indicar un problema en su soporte y empeorar con el uso normal.

# Recomendación

No apliques fuerza excesiva ni te apoyes con todo tu peso para probarla. Si notas movimiento, regístralo con foto.

# Fuente

- Criterio interno del proyecto. El Manual de Tolerancias (cap. 22) da solo la horizontalidad dimensional de la superficie (1 mm por metro lineal, verificable con nivel), no un criterio de fijación.
```

### `cubierta-bano-danos-visibles`

```
# Qué revisar

Si la cubierta presenta golpes, quiebres, trizaduras, rayas profundas, manchas, hinchamiento u otro deterioro o daño visible.

# Cómo revisarlo

Recorre visualmente toda la superficie de la cubierta con buena luz, incluidos sus bordes y, si tiene más de una pieza, las juntas entre ellas.

# Qué debería verse

La superficie sin golpes, quiebres, trizaduras, rayas profundas, manchas ni ningún otro deterioro visible — sin importar el material (piedra, cuarzo, cerámica, madera u otro).

# Qué señales pueden indicar un problema

- Golpes, quiebres o trizaduras.
- Rayas profundas.
- Manchas que no corresponden a suciedad removible con limpieza normal.
- Hinchamiento o deformación visible (más frecuente en materiales tipo MDF revestido).
- Separación o desalineamiento visible en las juntas entre piezas, si tiene más de una.

# Por qué importa

Un daño en la cubierta, aunque no genere una falla funcional inmediata, es un defecto de calidad de uso diario que conviene documentar.

# Recomendación

Si detectas cualquier daño, regístralo como observación con foto, indicando su ubicación exacta.

# Fuente

- Criterio interno del proyecto, comprobación visual directa — sin fuente normativa aplicable ni tolerancia estética definida.
```

### `cubierta-bano-sello`

```
# Qué revisar

Si el sello entre la cubierta y el muro (en el tramo que no corresponde al lavamanos, que se revisa por separado) se ve continuo, sin separaciones ni grietas.

# Cómo revisarlo

Observa el borde donde la cubierta se une al muro, en las zonas que no están directamente bajo el lavamanos.

# Qué debería verse

Un sello continuo, sin separaciones, grietas ni huecos visibles, sin importar el material de sellado usado.

# Qué señales pueden indicar un problema

- Separaciones o grietas visibles en el sello.
- Falta de sello donde debería haberlo.

# Por qué importa

Un sello en mal estado puede permitir el paso de agua hacia el muro, generando humedad sostenida si no se corrige — aunque hoy se vea seco.

# Recomendación

Si detectas separaciones o falta de sello, regístralo como observación con foto. No intentes resellar tú mismo.

# Fuente

- Criterio interno del proyecto, por analogía con el criterio ya usado para sellos perimetrales de otros componentes (ventana, lavamanos, ducha, tina, mampara) — sin fuente normativa aplicable.
```

Las 3 guías listas para implementación mecánica, no creadas en BD en esta fase.

## AF. No corresponde

**Confirmado: ninguno de los 3 checks necesita N/A.** Los 3 aplican siempre que el componente Cubierta exista (a diferencia de, por ejemplo, Lavamanos-Sello, que sí necesitó N/A porque algunas variantes de montaje de lavamanos no tienen ningún encuentro sellable — aquí, cualquier cubierta que exista siempre tiene una superficie que puede dañarse, un soporte que puede estar mal fijado, y un encuentro con el muro que puede o no estar sellado correctamente). Ningún check reconsiderado por exceso de N/A.

## AG. Referencias visuales

- **Fijación**: NO NECESARIA.
- **Daños visibles**: OPCIONAL/ALTO VALOR.
- **Sello cubierta-muro**: ALTO VALOR — confirmado explícitamente por el enunciado, mismo criterio que el resto de sellos del catálogo.

No se generan imágenes en esta fase.

## AH. Legacy

Confirmado: Cubierta de baño **no existe** en `artefactos-sanitarios` histórico. Los Baños históricos permanecen con su snapshot congelado y **no reciben Cubierta automáticamente** — mismo mecanismo de ancla histórica (`cielo`), sin caso especial. Sin migración, sin dato histórico que migrar. Sin tocar `active` de `artefactos-sanitarios` en esta fase.

## AI. Key

**Confirmada: `cubierta-bano`.** Se descarta `cubierta-vanitorio` — Cubierta puede existir sin Vanitorio (escenario F, cubierta de obra sin mueble inferior), por lo que nombrarla en función del vanitorio sería engañoso. Se descarta `cubierta-lavamanos` por el mismo motivo (puede existir antes de que el lavamanos esté instalado, o sin él). Se descarta `meson-bano` — "cubierta" es el término ya usado consistentemente en toda la serie de Baño (11AJ en adelante), preferible por consistencia documental. Label: **"Cubierta de baño"**, confirmado sin cambios respecto a la propuesta preliminar de 11AQ.

## AJ. Reutilización vs. nuevo template — decisión obligatoria

**Decisión: CREAR `cubierta-bano`, NO reutilizar `cubierta-meson` de Cocina.**

Comparación explícita, punto por punto:

| Aspecto | Cubierta Cocina | Cubierta Baño | ¿Equivalente? |
|---|---|---|---|
| Definición | Superficie de cocina, asociada a Muebles de cocina | Superficie de baño, asociada a Lavamanos y/o Mueble de baño | Similar en concepto, distinta en artefacto asociado |
| Checks | 2 (Fijación; Daños+Sello combinados) | 3 (Fijación; Daños; Sello separado) | **Divergen** — conteo distinto, justificado en sección N/Z |
| Fuentes | 🟡 criterio interno (mismas 2 notas del Manual cap. 22) | 🟡 criterio interno (mismas notas, reutilizadas honestamente) | Igual nivel de fuente, pero aplicado a un desglose distinto de checks |
| Severidades | MEDIUM / LOW (combinado) | MEDIUM / LOW / MEDIUM (Sello propio) | **Divergen** — el Sello separado tiene su propia severidad, distinta del LOW que tenía combinado con Daños en Cocina |
| Guías | 2 guías, contenido de cocina (mención de "cocinar", "apoyar objetos") | 3 guías, contenido y ejemplos de baño | **Divergen** — contenido no reutilizable literal |
| Contexto de humedad | Bajo (cocina, uso intermitente de agua) | Alto (baño, zona húmeda por diseño) | **Divergen** — justifica el desglose adicional de Sello (sección N) |
| Frontera con artefacto asociado | Sin necesidad de coordinar con Lavaplatos (Lavaplatos tiene su propio sello, sin overlap con Cubierta desde 11AF, situación ya resuelta de forma análoga) | Nueva coordinación con Lavamanos (11AM), tabla de frontera explícita (sección K) | Mismo tipo de patrón, pero nunca antes formalizado con una tabla explícita como esta fase |

**No son 100% equivalentes** — divergen en conteo de checks, severidades, contenido de guías y contexto de humedad. Reutilizar el mismo template habría significado o (a) usar solo 2 checks en Baño perdiendo la separación de Sello justificada por el contexto húmedo, o (b) modificar `cubierta-meson` para Baño, lo que habría alterado retroactivamente el componente ya publicado y verificado de Cocina — ninguna de las dos opciones es aceptable. Se crea `cubierta-bano` como template nuevo, independiente, sin duplicar catálogo de forma injustificada (la duplicación aquí está justificada por divergencia real, no por conveniencia).

## AK. Árbol final

```
Baño
└── Cubierta de baño [L2] — cubierta-bano
    ├── Fijación — MEDIUM — 🟡 criterio interno
    ├── Daños visibles — LOW — 🟡 criterio interno
    └── Sello cubierta-muro — MEDIUM — 🟡 criterio interno (analogía)
```

## AL. Nivel 2 final

Actualización de la rama dentro del árbol ya diseñado en 11AJ/11AQ (sin rediseñar el resto de Baño):

```
ARTEFACTOS SANITARIOS
├── WC / Inodoro [L2] — 4 checks (cerrado, 11AL)
├── Lavamanos [L2] — 5 checks (cerrado, 11AM)
├── Ducha [L2] — 6 checks (cerrado, 11AN)
├── Mampara [L2] — 5 checks (cerrado, 11AO)
├── Tina [L2] — 7 checks (cerrado, 11AP)
├── Mueble de baño / Vanitorio [L2] — 4 checks (cerrado, 11AQ)
└── Cubierta de baño [L2] — 3 checks (nuevo, cerrado en esta fase)
```

**10 decisiones Nivel 2 en total, todas cerradas técnicamente**: 3 TERMINACIONES + 2 EQUIPAMIENTO DEL RECINTO (Ventana, Extractor) + 7 ARTEFACTOS SANITARIOS (WC, Lavamanos, Ducha, Mampara, Tina, Mueble, Cubierta). `order` conceptual de Cubierta: 21, confirmado. Sin `metaOptions`.

## AM. Arquitectura final Lavamanos / Mueble / Cubierta

| Elemento | Independiente | Responsabilidad | Checks | Dependencia automática |
|---|---|---|---|---|
| **Lavamanos** | Sí | Cubeta, grifería, agua fría/caliente, fugas propias, fijación del artefacto, sello lavamanos-cubierta/muro inmediato | 5 (11AM) | **Cero** — puede existir sin Mueble y sin Cubierta |
| **Mueble de baño / Vanitorio** | Sí | Cuerpo, puertas, cajones, herrajes, fijación del mueble, daños del cuerpo, humedad/hinchamiento del material | 4 (11AQ) | **Cero** — puede existir sin Lavamanos y sin Cubierta |
| **Cubierta de baño** | Sí | Superficie, su fijación propia, sus daños, su encuentro con el muro (fuera del borde del lavamanos) | 3 (esta fase) | **Cero** — puede existir sin Mueble (escenario F) y sin Lavamanos instalado |

**Cero dependencias automáticas entre los 3 componentes, confirmado y cerrado definitivamente.** Los 6 escenarios reales (sección F) se representan todos sin mentira.

## AN. Conteos

Impacto sobre los conteos teóricos de Baño V1 (base 8 + Extractor 2 + WC 4 + Lavamanos 5 + Ducha 6 + Mampara 5 + Tina 7 + Mueble 4, acumulado 68 tras 11AQ):

- **Cubierta en No**: +0.
- **Cubierta en Sí**: **+3 checks** — 1 más que el conteo del precedente de Cocina (2), justificado explícitamente (sección N/Z), no copiado.
- **Máximo teórico de Baño V1, ahora completo (los 8 componentes especiales cerrados)**: 68 (tras 11AQ) + 3 (Cubierta) = **71**.
- **Mínimo**: 8 (solo base, las 10 decisiones Nivel 2 en No).

No se declara todavía el conteo "canónico" en el sentido de 11AI (eso corresponde a la futura fase de consolidación) — pero **con este cierre ya es posible calcularlo con precisión**, cumpliendo lo que el enunciado pedía dejar habilitado para la siguiente fase.

## AO. Auditoría de todos los componentes especiales

| Componente | Definición | Key | Base/L2 | Checks | Severidades | Fuentes | Guías | Históricos | Fronteras | Estado |
|---|---|---|---|---|---|---|---|---|---|---|
| Extractor de aire | ✅ | `extractor-aire` | L2 | 2 | ✅ | ✅ | ✅ | ✅ | Ventana | ✅ Cerrado (11AK) |
| WC / Inodoro | ✅ | `wc` | L2 | 4 | ✅ | ✅ | ✅ | ✅ | Lavamanos | ✅ Cerrado (11AL) |
| Lavamanos | ✅ | `lavamanos` | L2 | 5 | ✅ | ✅ | ✅ | ✅ | WC, Mueble, Cubierta | ✅ Cerrado (11AM) |
| Ducha | ✅ | `ducha` | L2 | 6 | ✅ | ✅ | ✅ | ✅ | Mampara, Tina | ✅ Cerrado (11AN) |
| Mampara | ✅ | `mampara` | L2 | 5 | ✅ | ✅ | ✅ | ✅ | Ducha, Tina | ✅ Cerrado (11AO) |
| Tina | ✅ | `tina` | L2 | 7 | ✅ | ✅ | ✅ | ✅ | Ducha, Mampara | ✅ Cerrado (11AP) |
| Mueble de baño / Vanitorio | ✅ | `mueble-bano` | L2 | 4 | ✅ | ✅ | ✅ | ✅ | Lavamanos, Cubierta | ✅ Cerrado (11AQ) |
| Cubierta de baño | ✅ | `cubierta-bano` | L2 | 3 | ✅ | ✅ | ✅ | ✅ | Lavamanos, Mueble | ✅ Cerrado (esta fase) |

**Los 8 componentes especiales tienen definición, key, clasificación Base/Nivel 2, checks exactos, severidades, fuentes, guías completas, políticas históricas y fronteras — todos confirmados. Ninguno queda abierto.**

## AP. Riesgos

- **Similitud con Cubierta Cocina**: analizada explícitamente y confirmada como divergencia real, no aparente (sección AJ) — riesgo de confusión mitigado con tabla comparativa punto por punto.
- **Duplicación de template**: evitada — decisión explícita de crear `cubierta-bano` en vez de reutilizar `cubierta-meson`, con justificación completa.
- **Encuentro con Lavamanos**: resuelto con tabla de frontera de sellos (sección K), sin ambigüedad.
- **Humedad del Mueble**: resuelto con regla explícita de no-causalidad automática (sección Y).
- **Materiales variables**: resuelto con wording material-agnóstico en Daños visibles (sección M/S).
- **Fuente no normativa**: aceptado explícitamente — 3 checks 🟡, ninguno inflado, Manual cap. 22 confirmado limitado a horizontalidad instrumental.
- **Horizontalidad no medida**: descartada explícitamente como check, sin afirmar cumplimiento sin instrumento (sección T).
- **Históricos**: sin dato histórico que migrar, mismo mecanismo de ancla ya validado en toda la serie.

## AQ. Estado final

Cubierta de baño queda completamente cerrada: componente definido (superficie fija asociada a Lavamanos y/o Mueble, material-agnóstica; excluye cuerpo del mueble, lavamanos, grifería, espejo, accesorios), key confirmada (`cubierta-bano`, nuevo template, no reutiliza `cubierta-meson` de Cocina — decisión justificada punto por punto), Nivel 2 confirmado (configurable, pregunta "¿El baño tiene cubierta o mesón instalado?", sección ARTEFACTOS SANITARIOS, `order` 21), 3 checks exactos con wording final (Fijación, Daños visibles, Sello cubierta-muro — 1 más que Cocina, justificado por el contexto húmedo y la nueva frontera con Lavamanos), severidades definidas y justificadas (MEDIUM/LOW/MEDIUM), fuentes clasificadas honestamente (3× 🟡, Manual cap. 22 confirmado limitado a horizontalidad instrumental, mismo hallazgo que Cocina), seguridad auditada, 3 guías completas de 7 encabezados listas para implementación mecánica, sin N/A necesario en ningún check, referencias visuales clasificadas, legacy confirmado sin dato histórico, frontera con Lavamanos y con Mueble resueltas con tablas explícitas sin ambigüedad, arquitectura final de los 3 componentes sanitarios centrales (Lavamanos/Mueble/Cubierta) confirmada con cero dependencias automáticas.

**Auditados los 8 componentes especiales de Baño V1 (sección AO): todos completamente cerrados, ninguno abierto.**

## CONTROL FINAL

Archivos creados:
- `docs/FASE11AR_CIERRE_TECNICO_CUBIERTA_BANO.md`

Archivos modificados: ninguno.

Código = 0
Prisma = 0
BD = NO
Catálogo = NO
Seed = NO
Commit = NO
Push = NO
Deploy = NO

FASE 11AR — CUBIERTA DE BAÑO CERRADA TÉCNICAMENTE
🟢 TODOS LOS COMPONENTES ESPECIALES DE BAÑO V1 CERRADOS TÉCNICAMENTE
🟢 APTO PARA CONSOLIDAR ARQUITECTURA Y LOTES DE IMPLEMENTACIÓN DE BAÑO V1

DETENERSE. No implementar todavía.
