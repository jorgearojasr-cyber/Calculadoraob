import { SearchBar } from "./search-bar";

// Home ObraBien V2 (2026-09-14) — Hero reconstruido, mucho más compacto
// que la versión anterior (243 líneas, título+subtítulo+pills+accesos
// rápidos+ilustración+carrusel). Objetivo del punto 3 del pedido: que el
// primer viewport en mobile muestre identidad + mensaje principal +
// buscador + inicio de las acciones principales, SIN un hero gigante.
//
// Se elimina la ilustración maestro+casa, los accesos rápidos (QUICK_ACCESS)
// y el carrusel de "Proyectos más buscados" (ver PopularCalculatorsSection,
// que cubre ese rol con datos reales más abajo en la nueva composición) —
// nada de eso se borra del repo (popular-tasks-carousel.tsx y
// getPopularTasks() se reutilizan en PopularCalculatorsSection), solo deja
// de usarse acá. El buscador es el MISMO componente (SearchBar) sin ningún
// cambio de comportamiento, solo un placeholder distinto.
export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #F1F5FB 0%, #FFFFFF 100%)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#002152 1px, transparent 1px), linear-gradient(90deg, #002152 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          opacity: 0.04,
        }}
      />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-10 pt-8 sm:pt-14 pb-6 sm:pb-10 flex flex-col items-center text-center gap-3 sm:gap-4">
        <h1
          className="text-[#10203A] font-extrabold text-[30px] sm:text-[44px]"
          style={{ lineHeight: 1.06, letterSpacing: "-0.026em" }}
        >
          Construye mejor.
        </h1>
        <p className="text-[15px] sm:text-[18px] leading-[1.5] text-[#4A5568] max-w-[440px]">
          Te acompañamos paso a paso en tu proyecto.
        </p>

        <div className="w-full max-w-[560px] mt-1 sm:mt-2">
          <SearchBar placeholder="¿Qué necesitas hacer?" size="mobile" />
        </div>
      </div>
    </section>
  );
}
