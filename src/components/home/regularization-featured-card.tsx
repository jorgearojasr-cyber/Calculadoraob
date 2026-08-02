import Image from "next/image";
import Link from "next/link";

// Restyle fiel a la especificación de UI de Home (§3.9, 2026-08-05) —
// reposicionada dentro de "Todas las categorías" (una sola instancia,
// también en mobile: decisión de producto 2026-08-05, Opción B — la
// especificación pedía una copia adicional dentro del Hero mobile, pero
// eso la haría competir con el buscador/CTA principal, exactamente lo
// que se quiere evitar. Misma jerarquía en ambas plataformas: primero
// las herramientas de construcción, Regularización después).
//
// Texto simplificado (decisión de producto 2026-08-05): gancho corto +
// disclaimer legal completo en línea aparte (más chica, pero siempre
// visible, nunca se quita) — sin los 4 bullets de detalle, que ahora
// viven dentro del propio módulo, no en la Home.
export function RegularizationFeaturedCard() {
  return (
    <Link
      href="/regularizacion"
      className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-[26px] rounded-[18px] p-5 sm:px-[26px] sm:py-[22px] overflow-hidden transition-colors"
      style={{ backgroundColor: "#EDF3FA", border: "1px solid #D8E3F1" }}
    >
      <div className="flex-1 min-w-0">
        <span
          className="inline-block font-mono text-[10px] uppercase text-white px-[9px] py-1 rounded-[5px] mb-2"
          style={{ letterSpacing: "0.1em", backgroundColor: "#002152" }}
        >
          Herramienta complementaria
        </span>
        <h2 className="text-xl sm:text-[22px] font-bold" style={{ color: "#002152", letterSpacing: "-0.015em" }}>
          ¿Necesitas regularizar tu vivienda?
        </h2>
        <p className="text-sm sm:text-[15px] font-medium mt-0.5" style={{ color: "#4A5568" }}>
          Ley N.º 20.898 (&quot;Ley del Mono&quot;)
        </p>
        <p className="text-[15px] leading-[1.45] mt-2" style={{ color: "#5B6577" }}>
          Conoce si tu vivienda podría acogerse a la Ley del Mono y revisa qué documentos normalmente
          se requieren para iniciar el proceso.
        </p>
        <p className="text-xs leading-[1.45] mt-2 text-[#5B6577]">
          Orientación inicial. No reemplaza la evaluación de un profesional ni el pronunciamiento de la
          Dirección de Obras Municipales (DOM).
        </p>
        <span
          className="inline-flex items-center mt-4 rounded-[11px] px-5 py-[13px] text-[15px] font-bold bg-white transition-colors"
          style={{ color: "#002152", border: "1px solid #C7D5E8" }}
        >
          Ir a Regularización →
        </span>
      </div>

      <div className="relative w-24 h-24 sm:w-[168px] sm:h-[126px] flex-shrink-0 mx-auto sm:mx-0 sm:-my-[22px] sm:-mr-[10px]">
        <Image
          src="/images/brand/regularizacion-escudo.png"
          alt=""
          fill
          className="object-contain"
          style={{ mixBlendMode: "multiply" }}
          sizes="168px"
        />
      </div>
    </Link>
  );
}
