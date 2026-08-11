import { describe, expect, it } from "vitest";
import { evaluarAsesorEjecucion } from "./evaluate";
import type { ExecutionAdvisorConfig } from "./types";

// Configuración de prueba — inspirada en el diseño real de Excavación
// (Fase 3/5) pero construida directamente acá, sin tocar la BD ni Prisma:
// exactamente lo que "función pura, testeable de forma aislada" pide.
const CONFIG_BASE: ExecutionAdvisorConfig = {
  nombre: "Asesor de Ejecución — Excavación",
  options: [
    { key: "manual", label: "Manual", descripcion: null, reduceConfidence: false, tipo: "metodo" },
    { key: "mini_excavadora", label: "Mini excavadora", descripcion: null, reduceConfidence: false, tipo: "metodo" },
    { key: "retroexcavadora", label: "Retroexcavadora", descripcion: null, reduceConfidence: false, tipo: "metodo" },
    { key: "excavadora", label: "Excavadora", descripcion: null, reduceConfidence: false, tipo: "metodo" },
    // Opciones de acceso/método cuya respuesta, si es la decisiva, baja
    // la confianza (ver schema.prisma, 04-ago-2026) — no son "métodos"
    // recomendables, por eso `detectarEleccionUsuario` ya no lee de acá.
    // `tipo` (04-ago-2026, Fase 4) tampoco lo lee evaluate.ts — solo lo
    // usa action.ts, no probado en este archivo (que es del motor puro).
    { key: "no_seguro", label: "No estoy seguro (acceso)", descripcion: null, reduceConfidence: true, tipo: "acceso" },
    { key: "no_se", label: "No sé (método)", descripcion: null, reduceConfidence: true, tipo: "metodo" },
  ],
  rules: [
    {
      prioridad: 1,
      condiciones: [{ questionKey: "acceso", operador: "equals", valor: "solo_peatonal" }],
      opcionRecomendadaKey: "manual",
      confianzaBase: "alta",
    },
    {
      prioridad: 1,
      condiciones: [{ questionKey: "acceso", operador: "equals", valor: "no_seguro" }],
      opcionRecomendadaKey: "manual",
      confianzaBase: "alta",
    },
    {
      prioridad: 2,
      condiciones: [{ questionKey: "terreno", operador: "equals", valor: "con-arcilla-o-piedras" }],
      opcionRecomendadaKey: "retroexcavadora",
      confianzaBase: "media",
    },
    {
      prioridad: 3,
      condiciones: [{ questionKey: "acceso", operador: "in", valor: ["calle_directo", "patio_pasillo"] }],
      opcionRecomendadaKey: "mini_excavadora",
      confianzaBase: "alta",
    },
  ],
  factorExplanations: [
    {
      factorQuestionKey: "acceso",
      condicion: { questionKey: "acceso", operador: "equals", valor: "solo_peatonal" },
      fragmentoTexto: "el acceso al terreno es solo peatonal",
      peso: 10,
      tipoConsideracion: "consideracion_importante",
      textoConsideracion: "Sin acceso vehicular, todo el retiro de tierra deberá hacerse a mano o en carretilla.",
    },
    {
      factorQuestionKey: "acceso",
      condicion: { questionKey: "acceso", operador: "equals", valor: "no_seguro" },
      fragmentoTexto: "no estás seguro de cómo se accede al terreno",
      peso: 10,
      tipoConsideracion: "revisa_antes_contratar",
      textoConsideracion: "Confirma el acceso real antes de contratar máquina — puede no ser viable.",
    },
    {
      factorQuestionKey: "acceso",
      condicion: { questionKey: "acceso", operador: "in", valor: ["calle_directo", "patio_pasillo"] },
      fragmentoTexto: "el terreno tiene acceso directo desde la calle",
      peso: 5,
      tipoConsideracion: null,
      textoConsideracion: null,
    },
    {
      factorQuestionKey: "terreno",
      condicion: { questionKey: "terreno", operador: "equals", valor: "con-arcilla-o-piedras" },
      fragmentoTexto: "el terreno tiene arcilla o piedras",
      peso: 6,
      tipoConsideracion: "ten_presente",
      textoConsideracion: "Un terreno con arcilla o piedras es más lento de excavar a mano.",
    },
  ],
  tips: [
    { aplicaAOpcionKey: "manual", texto: "Ten pala, pico y carretilla listos antes de empezar.", orden: 1 },
    { aplicaAOpcionKey: "mini_excavadora", texto: "Confirma el ancho de acceso real con el operador.", orden: 1 },
    { aplicaAOpcionKey: "retroexcavadora", texto: "Coordina el horario de entrada de la máquina con vecinos.", orden: 1 },
  ],
};

describe("evaluarAsesorEjecucion", () => {
  it("(a) elección = recomendación: sin mensaje aclaratorio, tips de esa opción", () => {
    const informe = evaluarAsesorEjecucion(
      { acceso: "solo_peatonal", metodo: "manual" },
      CONFIG_BASE
    );

    expect(informe.recomendacion?.metodoKey).toBe("manual");
    expect(informe.eleccionUsuario.metodoKey).toBe("manual");
    expect(informe.eleccionUsuario.difiereDeRecomendacion).toBe(false);
    expect(informe.antesDeComenzar.mensajeAclaratorio).toBeUndefined();
    expect(informe.antesDeComenzar.tips).toEqual(["Ten pala, pico y carretilla listos antes de empezar."]);
  });

  it("(b) elección ≠ recomendación: mensaje aclaratorio presente, tips de la elección real (no de la recomendación)", () => {
    const informe = evaluarAsesorEjecucion(
      { acceso: "solo_peatonal", metodo: "retroexcavadora" },
      CONFIG_BASE
    );

    expect(informe.recomendacion?.metodoKey).toBe("manual");
    expect(informe.eleccionUsuario.metodoKey).toBe("retroexcavadora");
    expect(informe.eleccionUsuario.difiereDeRecomendacion).toBe(true);
    expect(informe.antesDeComenzar.mensajeAclaratorio).toContain("Manual");
    expect(informe.antesDeComenzar.tips).toEqual([
      "Coordina el horario de entrada de la máquina con vecinos.",
    ]);
  });

  it("(c) factor decisivo = 'no_seguro': confianza baja un nivel respecto al techo de la regla", () => {
    const informe = evaluarAsesorEjecucion({ acceso: "no_seguro" }, CONFIG_BASE);

    // La regla de acceso="no_seguro" tiene confianzaBase "alta", pero el
    // factor decisivo (mismo questionKey, mismo peso 10 que "solo_peatonal"
    // pero acá el único activo) responde "no_seguro" — debe bajar a "media".
    expect(informe.recomendacion?.confianza.nivel).toBe("media");
    expect(informe.recomendacion?.confianza.textoExplicativo).toContain("no estás seguro");
    expect(informe.recomendacion?.confianza.textoExplicativo).toContain("ajustó a la baja");
  });

  it("no baja el nivel de confianza cuando el factor decisivo no es una respuesta incierta", () => {
    const informe = evaluarAsesorEjecucion({ acceso: "solo_peatonal" }, CONFIG_BASE);

    expect(informe.recomendacion?.confianza.nivel).toBe("alta");
    expect(informe.recomendacion?.confianza.textoExplicativo).not.toContain("ajustó a la baja");
  });

  it("confianzaBase actúa como techo — 'baja' no puede bajar más", () => {
    const configConfianzaBaja: ExecutionAdvisorConfig = {
      ...CONFIG_BASE,
      rules: [
        {
          prioridad: 1,
          condiciones: [{ questionKey: "acceso", operador: "equals", valor: "no_seguro" }],
          opcionRecomendadaKey: "manual",
          confianzaBase: "baja",
        },
      ],
    };
    const informe = evaluarAsesorEjecucion({ acceso: "no_seguro" }, configConfianzaBaja);
    expect(informe.recomendacion?.confianza.nivel).toBe("baja");
  });

  it("cascada por prioridad: acceso (prioridad 1) gana por sobre terreno (prioridad 2) aunque ambas condiciones se cumplan", () => {
    const informe = evaluarAsesorEjecucion(
      { acceso: "solo_peatonal", terreno: "con-arcilla-o-piedras" },
      CONFIG_BASE
    );
    expect(informe.recomendacion?.metodoKey).toBe("manual");
  });

  it("sin ninguna regla que aplique: recomendacion es null, pero eleccionUsuario y tips siguen resolviéndose", () => {
    const informe = evaluarAsesorEjecucion({ acceso: "un-valor-no-contemplado", metodo: "manual" }, CONFIG_BASE);
    expect(informe.recomendacion).toBeNull();
    expect(informe.eleccionUsuario.metodoKey).toBe("manual");
    expect(informe.antesDeComenzar.tips).toEqual(["Ten pala, pico y carretilla listos antes de empezar."]);
  });

  it("eleccionUsuario.metodoKey nunca es igual a la recomendación por definición — lee la respuesta real del usuario, no la regla", () => {
    const informe = evaluarAsesorEjecucion({ acceso: "no_seguro" }, CONFIG_BASE);
    // El usuario no respondió la pregunta de método en este caso.
    expect(informe.eleccionUsuario.metodoKey).toBeNull();
    expect(informe.eleccionUsuario.difiereDeRecomendacion).toBe(false);
  });

  it("Fase 10B — empate de prioridad: entre 2 reglas con la misma prioridad, gana la primera del array (orden de entrada, no un criterio de negocio declarado — comportamiento documentado, no corregido en esta fase)", () => {
    const configConEmpate: ExecutionAdvisorConfig = {
      ...CONFIG_BASE,
      rules: [
        {
          prioridad: 1,
          condiciones: [{ questionKey: "acceso", operador: "equals", valor: "solo_peatonal" }],
          opcionRecomendadaKey: "manual",
          confianzaBase: "alta",
        },
        {
          // Misma prioridad (1) y misma condición cumplible: en un
          // catálogo real esto sería una inconsistencia editorial, pero
          // el motor no la detecta ni la rechaza — solo aplica el orden.
          prioridad: 1,
          condiciones: [{ questionKey: "acceso", operador: "equals", valor: "solo_peatonal" }],
          opcionRecomendadaKey: "excavadora",
          confianzaBase: "media",
        },
      ],
    };
    const informe = evaluarAsesorEjecucion({ acceso: "solo_peatonal" }, configConEmpate);
    // Gana "manual" (primera del array), no "excavadora" (segunda) —
    // fija el comportamiento actual como contrato explícito.
    expect(informe.recomendacion?.metodoKey).toBe("manual");
  });
});

// Fase 10D (10-ago-2026) — configuración REAL de "excavacion" tal como
// queda en BD después del ajuste editorial de Fase 10C/10D: las 5 reglas
// reales (mismas condiciones/opciones que en producción), con las 2
// confianzas ya bajadas de ALTA a MEDIA (patio_pasillo->mini_excavadora,
// calle_directo+tierra-normal->retroexcavadora). Pin de regresión: si
// alguien vuelve a subir alguna de esas 2 confianzas sin pasar por una
// revisión editorial explícita, este test debe fallar. Las otras 3
// reglas deben seguir exactamente igual que antes del ajuste.
const CONFIG_EXCAVACION_REAL: ExecutionAdvisorConfig = {
  nombre: "Asesor de Ejecución — Excavación",
  options: [
    { key: "manual", label: "Manual", descripcion: null, reduceConfidence: false, tipo: "metodo" },
    { key: "mini_excavadora", label: "Mini excavadora", descripcion: null, reduceConfidence: false, tipo: "metodo" },
    { key: "retroexcavadora", label: "Retroexcavadora", descripcion: null, reduceConfidence: false, tipo: "metodo" },
    { key: "excavadora", label: "Excavadora", descripcion: null, reduceConfidence: false, tipo: "metodo" },
    { key: "calle_directo", label: "Calle directa, entrada amplia", descripcion: null, reduceConfidence: false, tipo: "acceso" },
    { key: "patio_pasillo", label: "Por patio o pasillo, algo angosto", descripcion: null, reduceConfidence: false, tipo: "acceso" },
    { key: "solo_peatonal", label: "Solo acceso peatonal, sin entrada de vehículos", descripcion: null, reduceConfidence: false, tipo: "acceso" },
    { key: "no_seguro", label: "No estoy seguro", descripcion: null, reduceConfidence: true, tipo: "acceso" },
    { key: "tierra-normal", label: "Tierra normal", descripcion: null, reduceConfidence: false, tipo: "terreno" },
    { key: "con-arcilla-o-piedras", label: "Con arcilla o piedras", descripcion: null, reduceConfidence: false, tipo: "terreno" },
  ],
  rules: [
    {
      prioridad: 1,
      condiciones: [{ questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "solo_peatonal" }],
      opcionRecomendadaKey: "manual",
      confianzaBase: "alta", // sin cambios en Fase 10D
    },
    {
      prioridad: 1,
      condiciones: [{ questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "no_seguro" }],
      opcionRecomendadaKey: "manual",
      confianzaBase: "alta", // sin cambios — se degrada a "media" en runtime por reduceConfidence
    },
    {
      prioridad: 1,
      condiciones: [{ questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "patio_pasillo" }],
      opcionRecomendadaKey: "mini_excavadora",
      confianzaBase: "media", // Fase 10D: antes "alta"
    },
    {
      prioridad: 2,
      condiciones: [
        { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "calle_directo" },
        { questionKey: "que-tipo-de-terreno-es", operador: "equals", valor: "tierra-normal" },
      ],
      opcionRecomendadaKey: "retroexcavadora",
      confianzaBase: "media", // Fase 10D: antes "alta"
    },
    {
      prioridad: 2,
      condiciones: [
        { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "calle_directo" },
        { questionKey: "que-tipo-de-terreno-es", operador: "equals", valor: "con-arcilla-o-piedras" },
      ],
      opcionRecomendadaKey: "excavadora",
      confianzaBase: "media", // sin cambios en Fase 10D
    },
  ],
  factorExplanations: [
    {
      factorQuestionKey: "como-se-puede-acceder-al-terreno-para-excavar",
      condicion: { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "solo_peatonal" },
      fragmentoTexto: "el acceso al terreno es solo peatonal",
      peso: 10,
      tipoConsideracion: "consideracion_importante",
      textoConsideracion: "Sin acceso vehicular, vas a necesitar más tiempo y esfuerzo para sacar la tierra excavada — puede convenir coordinar ayuda extra o repartir el trabajo en varias jornadas.",
    },
    {
      factorQuestionKey: "como-se-puede-acceder-al-terreno-para-excavar",
      condicion: { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "no_seguro" },
      fragmentoTexto: "todavía no estás seguro de cómo se accede al terreno",
      peso: 10,
      tipoConsideracion: "revisa_antes_contratar",
      textoConsideracion: "Antes de coordinar máquina o ayuda extra, conviene confirmar el acceso real al terreno — puede cambiar bastante qué opción resulta más práctica.",
    },
    {
      factorQuestionKey: "como-se-puede-acceder-al-terreno-para-excavar",
      condicion: { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "patio_pasillo" },
      fragmentoTexto: "el acceso es por patio o pasillo, más angosto que una entrada directa",
      peso: 8,
      tipoConsideracion: "ten_presente",
      textoConsideracion: "Antes de contratar la máquina, conviene medir el ancho real del paso — no todas las mini excavadoras entran por el mismo espacio.",
    },
    {
      factorQuestionKey: "que-tipo-de-terreno-es",
      condicion: { questionKey: "que-tipo-de-terreno-es", operador: "equals", valor: "con-arcilla-o-piedras" },
      fragmentoTexto: "el terreno tiene arcilla o piedras, lo que suele hacer la excavación más lenta",
      peso: 6,
      tipoConsideracion: "ten_presente",
      textoConsideracion: "Con arcilla o piedras, el trabajo puede tomar más tiempo del esperado — conviene dejar algo de holgura en la planificación.",
    },
    {
      factorQuestionKey: "como-se-puede-acceder-al-terreno-para-excavar",
      condicion: { questionKey: "como-se-puede-acceder-al-terreno-para-excavar", operador: "equals", valor: "calle_directo" },
      fragmentoTexto: "el terreno tiene acceso directo desde la calle",
      peso: 5,
      tipoConsideracion: null,
      textoConsideracion: null,
    },
  ],
  tips: [
    { aplicaAOpcionKey: "manual", texto: "Ten pala, pico y carretilla a mano antes de marcar el área, para no interrumpir el trabajo a mitad de camino.", orden: 1 },
    { aplicaAOpcionKey: "manual", texto: "Confirma que el lugar donde vas a dejar la tierra excavada tenga espacio suficiente antes de empezar.", orden: 2 },
    { aplicaAOpcionKey: "mini_excavadora", texto: "Confirma con el operador el ancho exacto de acceso disponible antes de coordinar la máquina.", orden: 1 },
    { aplicaAOpcionKey: "mini_excavadora", texto: "Revisa que no haya cables, tuberías u otras instalaciones marcadas en la zona antes de que llegue la máquina.", orden: 2 },
    { aplicaAOpcionKey: "retroexcavadora", texto: "Coordina con el operador el punto de entrada y el espacio de giro de la máquina antes del día de trabajo.", orden: 1 },
    { aplicaAOpcionKey: "retroexcavadora", texto: "Verifica que el camino de acceso soporte el peso de la máquina, especialmente si hay veredas o pavimento de por medio.", orden: 2 },
    { aplicaAOpcionKey: "excavadora", texto: "Confirma con el operador el espacio de maniobra necesario — una excavadora completa suele necesitar más radio de giro que una retroexcavadora.", orden: 1 },
    { aplicaAOpcionKey: "excavadora", texto: "Si la maquinaria ocupará parte de la vía pública, consulta con tu municipalidad si corresponde realizar alguna coordinación o solicitar un permiso.", orden: 2 },
  ],
};

describe("evaluarAsesorEjecucion — configuración real de excavación post Fase 10D", () => {
  it("solo_peatonal -> manual, confianza ALTA (sin cambios)", () => {
    const informe = evaluarAsesorEjecucion({ "como-se-puede-acceder-al-terreno-para-excavar": "solo_peatonal" }, CONFIG_EXCAVACION_REAL);
    expect(informe.recomendacion?.metodoKey).toBe("manual");
    expect(informe.recomendacion?.confianza.nivel).toBe("alta");
  });

  it("no_seguro -> manual, confianza degradada a MEDIA (sin cambios — mecanismo reduceConfidence)", () => {
    const informe = evaluarAsesorEjecucion({ "como-se-puede-acceder-al-terreno-para-excavar": "no_seguro" }, CONFIG_EXCAVACION_REAL);
    expect(informe.recomendacion?.metodoKey).toBe("manual");
    expect(informe.recomendacion?.confianza.nivel).toBe("media");
  });

  it("Fase 10D: patio_pasillo -> mini_excavadora, confianza MEDIA (antes ALTA)", () => {
    const informe = evaluarAsesorEjecucion({ "como-se-puede-acceder-al-terreno-para-excavar": "patio_pasillo" }, CONFIG_EXCAVACION_REAL);
    expect(informe.recomendacion?.metodoKey).toBe("mini_excavadora");
    expect(informe.recomendacion?.confianza.nivel).toBe("media");
  });

  it("Fase 10D: calle_directo + tierra-normal -> retroexcavadora, confianza MEDIA (antes ALTA)", () => {
    const informe = evaluarAsesorEjecucion(
      { "como-se-puede-acceder-al-terreno-para-excavar": "calle_directo", "que-tipo-de-terreno-es": "tierra-normal" },
      CONFIG_EXCAVACION_REAL
    );
    expect(informe.recomendacion?.metodoKey).toBe("retroexcavadora");
    expect(informe.recomendacion?.confianza.nivel).toBe("media");
  });

  it("calle_directo + con-arcilla-o-piedras -> excavadora, confianza MEDIA (sin cambios)", () => {
    const informe = evaluarAsesorEjecucion(
      { "como-se-puede-acceder-al-terreno-para-excavar": "calle_directo", "que-tipo-de-terreno-es": "con-arcilla-o-piedras" },
      CONFIG_EXCAVACION_REAL
    );
    expect(informe.recomendacion?.metodoKey).toBe("excavadora");
    expect(informe.recomendacion?.confianza.nivel).toBe("media");
  });

  it("integridad: siguen siendo exactamente 10 opciones, 5 reglas y 8 tips", () => {
    expect(CONFIG_EXCAVACION_REAL.options).toHaveLength(10);
    expect(CONFIG_EXCAVACION_REAL.rules).toHaveLength(5);
    expect(CONFIG_EXCAVACION_REAL.tips).toHaveLength(8);
  });
});
