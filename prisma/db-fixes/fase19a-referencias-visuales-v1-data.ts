// Fase 19A (docs/FASE19A_DT04_REFERENCIAS_VISUALES_V1.md) — datos puros
// (sin efectos de import) de la matriz DT-04, separados del script
// ejecutable para que puedan importarse desde tests sin disparar main().
export type RefRow = {
  elementKey: string;
  question: string;
  assetKey: string;
  good: { alt: string; caption: string };
  bad: { alt: string; caption: string };
};

export const ROWS: RefRow[] = [
  {
    elementKey: "piso",
    question: "¿Presenta daños visibles?",
    assetKey: "piso-danos",
    good: { alt: "Ejemplo de piso sin daños visibles, superficie pareja.", caption: "Piso sin daños, superficie pareja." },
    bad: { alt: "Ejemplo de piso con una pieza trisada y despuntada.", caption: "Pieza trisada y despuntada." },
  },
  {
    elementKey: "piso",
    question: "¿Presenta desniveles?",
    assetKey: "piso-desnivel",
    good: { alt: "Ejemplo de piso parejo, sin diferencias de altura.", caption: "Piso parejo, sin desniveles." },
    bad: { alt: "Ejemplo de piso con un desnivel entre dos zonas.", caption: "Desnivel visible entre dos zonas del piso." },
  },
  {
    elementKey: "muros",
    question: "¿Presenta fisuras visibles?",
    assetKey: "muro-fisura",
    good: { alt: "Ejemplo de muro sin fisuras, superficie lisa.", caption: "Muro sin fisuras." },
    bad: { alt: "Ejemplo de muro con una fisura visible.", caption: "Fisura visible en el muro." },
  },
  {
    elementKey: "cielo",
    question: "¿El cielo presenta manchas, grietas u otros daños visibles?",
    assetKey: "cielo-grietas",
    good: { alt: "Ejemplo de cielo sin grietas ni daños visibles.", caption: "Cielo sin grietas ni daños." },
    bad: { alt: "Ejemplo de cielo con grietas cerca de una esquina.", caption: "Grietas visibles cerca de una esquina del cielo." },
  },
  {
    elementKey: "cielo",
    question: "¿Se observan manchas de humedad en el cielo?",
    assetKey: "cielo-humedad",
    good: { alt: "Ejemplo de cielo sin manchas de humedad.", caption: "Cielo sin manchas de humedad." },
    bad: { alt: "Ejemplo de mancha de humedad visible en el cielo.", caption: "Mancha de humedad visible." },
  },
  {
    elementKey: "pintura-muro",
    question: "¿Se observan manchas, marcas o defectos visibles en la pintura?",
    assetKey: "pintura-defecto",
    good: { alt: "Ejemplo de pintura uniforme, sin manchas ni marcas.", caption: "Pintura uniforme." },
    bad: { alt: "Ejemplo de pintura con mancha y descascarado visible.", caption: "Mancha y descascarado visibles en la pintura." },
  },
  {
    elementKey: "revestimiento-ceramico-piso",
    question: "¿Hay palmetas quebradas, trisadas o despuntadas?",
    assetKey: "ceramica-quebrada",
    good: { alt: "Ejemplo de palmetas cerámicas enteras, sin quiebres.", caption: "Palmetas enteras, sin quiebres." },
    bad: { alt: "Ejemplo de palmeta cerámica quebrada y despuntada.", caption: "Palmeta quebrada y despuntada." },
  },
  {
    elementKey: "revestimiento-ceramico-muro",
    question: "¿Hay palmetas quebradas, trisadas o despuntadas?",
    assetKey: "ceramica-quebrada",
    good: { alt: "Ejemplo de palmetas cerámicas enteras, sin quiebres.", caption: "Palmetas enteras, sin quiebres." },
    bad: { alt: "Ejemplo de palmeta cerámica quebrada y despuntada.", caption: "Palmeta quebrada y despuntada." },
  },
  {
    elementKey: "revestimiento-ceramico-piso",
    question: "¿Se observan defectos visibles en el esmalte o superficie de las palmetas?",
    assetKey: "ceramica-esmalte",
    good: { alt: "Ejemplo de superficie de palmeta lisa y uniforme.", caption: "Superficie lisa y uniforme." },
    bad: { alt: "Ejemplo de defectos de esmalte: rayas y picaduras visibles.", caption: "Rayas y picaduras visibles en el esmalte." },
  },
  {
    elementKey: "revestimiento-ceramico-muro",
    question: "¿Se observan defectos visibles en el esmalte o superficie de las palmetas?",
    assetKey: "ceramica-esmalte",
    good: { alt: "Ejemplo de superficie de palmeta lisa y uniforme.", caption: "Superficie lisa y uniforme." },
    bad: { alt: "Ejemplo de defectos de esmalte: rayas y picaduras visibles.", caption: "Rayas y picaduras visibles en el esmalte." },
  },
  {
    elementKey: "ventana",
    question: "¿El vidrio presenta rayas, trizaduras u otros daños visibles?",
    assetKey: "vidrio-danos",
    good: { alt: "Ejemplo de vidrio limpio, sin rayas ni trizaduras.", caption: "Vidrio sin daños visibles." },
    bad: { alt: "Ejemplo de vidrio con una trizadura visible.", caption: "Trizadura visible en el vidrio." },
  },
  {
    elementKey: "mampara",
    question: "¿Los vidrios o perfiles de la mampara presentan trizaduras, quiebres, rayas profundas u otros daños visibles?",
    assetKey: "vidrio-danos",
    good: { alt: "Ejemplo de vidrio limpio, sin rayas ni trizaduras.", caption: "Vidrio sin daños visibles." },
    bad: { alt: "Ejemplo de vidrio con una trizadura visible.", caption: "Trizadura visible en el vidrio." },
  },
  {
    elementKey: "ventana",
    question: "Si la ventana es de termopanel (doble vidrio), ¿se ve condensación o empañamiento ENTRE los vidrios?",
    assetKey: "vidrio-condensacion",
    good: {
      alt: "Ejemplo de termopanel transparente, sin condensación entre los vidrios.",
      caption: "Sin condensación entre los vidrios.",
    },
    bad: {
      alt: "Ejemplo de termopanel con condensación visible entre los vidrios.",
      caption: "Condensación visible entre los vidrios.",
    },
  },
  {
    elementKey: "ventana",
    question: "¿El sello entre el marco de la ventana y el muro se ve continuo, sin separaciones ni grietas?",
    assetKey: "sello-perimetral",
    good: { alt: "Ejemplo de sello continuo, sin separaciones visibles.", caption: "Sello continuo, sin separaciones." },
    bad: { alt: "Ejemplo de sello cortado, con una separación visible.", caption: "Sello cortado o discontinuo." },
  },
  {
    elementKey: "lavaplatos",
    question: "¿El sello alrededor del lavaplatos se ve continuo, sin separaciones ni grietas?",
    assetKey: "sello-perimetral",
    good: { alt: "Ejemplo de sello continuo, sin separaciones visibles.", caption: "Sello continuo, sin separaciones." },
    bad: { alt: "Ejemplo de sello cortado, con una separación visible.", caption: "Sello cortado o discontinuo." },
  },
  {
    elementKey: "lavamanos",
    question:
      "Si el lavamanos tiene un encuentro visible con la cubierta o el muro (por ejemplo, sobre o bajo una cubierta), ¿ese sello se ve continuo, sin separaciones ni grietas?",
    assetKey: "sello-perimetral",
    good: { alt: "Ejemplo de sello continuo, sin separaciones visibles.", caption: "Sello continuo, sin separaciones." },
    bad: { alt: "Ejemplo de sello cortado, con una separación visible.", caption: "Sello cortado o discontinuo." },
  },
  {
    elementKey: "ducha",
    question:
      "El sello entre el receptáculo/plato de la ducha (o el piso de la zona de ducha) y el muro, ¿se ve continuo, sin separaciones ni grietas?",
    assetKey: "sello-perimetral",
    good: { alt: "Ejemplo de sello continuo, sin separaciones visibles.", caption: "Sello continuo, sin separaciones." },
    bad: { alt: "Ejemplo de sello cortado, con una separación visible.", caption: "Sello cortado o discontinuo." },
  },
  {
    elementKey: "tina",
    question: "El sello visible entre la tina y el muro (y el piso, si existe ese encuentro), ¿se ve continuo, sin separaciones ni grietas?",
    assetKey: "sello-perimetral",
    good: { alt: "Ejemplo de sello continuo, sin separaciones visibles.", caption: "Sello continuo, sin separaciones." },
    bad: { alt: "Ejemplo de sello cortado, con una separación visible.", caption: "Sello cortado o discontinuo." },
  },
  {
    elementKey: "mampara",
    question: "¿Los sellos visibles de la mampara (perfiles contra el muro o el receptáculo, uniones entre paneles) se ven continuos, sin separaciones ni grietas?",
    assetKey: "sello-perimetral",
    good: { alt: "Ejemplo de sello continuo, sin separaciones visibles.", caption: "Sello continuo, sin separaciones." },
    bad: { alt: "Ejemplo de sello cortado, con una separación visible.", caption: "Sello cortado o discontinuo." },
  },
  {
    elementKey: "cubierta-bano",
    question: "El sello entre la cubierta y el muro (en el tramo que no corresponde al Lavamanos), ¿se ve continuo, sin separaciones ni grietas?",
    assetKey: "sello-perimetral",
    good: { alt: "Ejemplo de sello continuo, sin separaciones visibles.", caption: "Sello continuo, sin separaciones." },
    bad: { alt: "Ejemplo de sello cortado, con una separación visible.", caption: "Sello cortado o discontinuo." },
  },
  {
    elementKey: "lavadero",
    question: "¿El sello alrededor del lavadero se ve continuo, sin separaciones ni grietas?",
    assetKey: "sello-perimetral",
    good: { alt: "Ejemplo de sello continuo, sin separaciones visibles.", caption: "Sello continuo, sin separaciones." },
    bad: { alt: "Ejemplo de sello cortado, con una separación visible.", caption: "Sello cortado o discontinuo." },
  },
  {
    elementKey: "ventana",
    question: "Con la ventana cerrada, ¿se ve alguna separación entre la hoja y el marco?",
    assetKey: "ventana-gap",
    good: { alt: "Ejemplo de hoja bien ajustada al marco, sin separación visible.", caption: "Hoja ajustada, sin separación." },
    bad: { alt: "Ejemplo de separación visible entre la hoja y el marco.", caption: "Separación visible entre hoja y marco." },
  },
  {
    elementKey: "ventana",
    question: "¿El marco de la ventana presenta golpes, rayas profundas o deformaciones visibles?",
    assetKey: "marco-danos",
    good: { alt: "Ejemplo de marco de ventana sin golpes ni deformaciones.", caption: "Marco sin daños visibles." },
    bad: { alt: "Ejemplo de marco con golpe y deformación visible.", caption: "Golpe y deformación visibles en el marco." },
  },
  {
    elementKey: "baranda",
    question: "¿Presenta daños visibles: barrotes sueltos, quebrados, oxidados u otros deterioros?",
    assetKey: "baranda-danos",
    good: { alt: "Ejemplo de barrotes íntegros, sin daños visibles.", caption: "Barrotes íntegros, sin daños." },
    bad: { alt: "Ejemplo de barrote quebrado y oxidado.", caption: "Barrote quebrado y oxidado." },
  },
  {
    elementKey: "baranda",
    question: "¿La baranda está firmemente fijada a la estructura, sin separaciones visibles en sus anclajes?",
    assetKey: "baranda-anclaje",
    good: { alt: "Ejemplo de anclaje firme, sin separaciones visibles.", caption: "Anclaje firme, sin separaciones." },
    bad: { alt: "Ejemplo de separación visible en el anclaje de la baranda.", caption: "Separación visible en el anclaje." },
  },
  {
    elementKey: "closet",
    question: "¿Presenta daños visibles: golpes, rayas profundas, paneles despegados o quebrados?",
    assetKey: "mueble-danos",
    good: { alt: "Ejemplo de panel de mueble sin golpes ni daños visibles.", caption: "Panel sin daños visibles." },
    bad: { alt: "Ejemplo de panel con golpe y rayas visibles.", caption: "Golpe y rayas visibles en el panel." },
  },
  {
    elementKey: "muebles-cocina",
    question: "¿Los muebles presentan golpes, quiebres, rayas profundas u otros daños visibles?",
    assetKey: "mueble-danos",
    good: { alt: "Ejemplo de panel de mueble sin golpes ni daños visibles.", caption: "Panel sin daños visibles." },
    bad: { alt: "Ejemplo de panel con golpe y rayas visibles.", caption: "Golpe y rayas visibles en el panel." },
  },
  {
    elementKey: "mueble-bano",
    question: "¿El mueble presenta golpes, quiebres, rayas profundas, cantos despegados u otros daños visibles?",
    assetKey: "mueble-danos",
    good: { alt: "Ejemplo de panel de mueble sin golpes ni daños visibles.", caption: "Panel sin daños visibles." },
    bad: { alt: "Ejemplo de panel con golpe y rayas visibles.", caption: "Golpe y rayas visibles en el panel." },
  },
  {
    elementKey: "wc",
    question: "¿El inodoro presenta trizaduras, quiebres, golpes u otros daños visibles en la loza?",
    assetKey: "loza-trizada",
    good: { alt: "Ejemplo de loza sanitaria sin trizaduras ni daños.", caption: "Loza sin trizaduras ni daños." },
    bad: { alt: "Ejemplo de trizadura visible en la loza sanitaria.", caption: "Trizadura visible en la loza." },
  },
  {
    elementKey: "tina",
    question: "¿La tina presenta trizaduras, quiebres, golpes, esmalte saltado u otros daños visibles?",
    assetKey: "loza-trizada",
    good: { alt: "Ejemplo de loza sanitaria sin trizaduras ni daños.", caption: "Loza sin trizaduras ni daños." },
    bad: { alt: "Ejemplo de trizadura visible en la loza sanitaria.", caption: "Trizadura visible en la loza." },
  },
  {
    elementKey: "closet",
    question: "¿Se observan manchas de humedad o deformación (hinchazón) en el interior o en las puertas del clóset?",
    assetKey: "mueble-humedad",
    good: { alt: "Ejemplo de panel sin manchas de humedad ni hinchazón.", caption: "Panel sin humedad ni hinchazón." },
    bad: { alt: "Ejemplo de panel hinchado con mancha de humedad.", caption: "Hinchazón y mancha de humedad visibles." },
  },
  {
    elementKey: "mueble-bano",
    question:
      "¿Se observan señales de humedad en el mueble (tablero hinchado, melamina levantada, cantos despegados por humedad, manchas, o moho visible)?",
    assetKey: "mueble-humedad",
    good: { alt: "Ejemplo de panel sin manchas de humedad ni hinchazón.", caption: "Panel sin humedad ni hinchazón." },
    bad: { alt: "Ejemplo de panel hinchado con mancha de humedad.", caption: "Hinchazón y mancha de humedad visibles." },
  },
  {
    elementKey: "estacionamiento",
    question: "¿La demarcación del espacio es clara y el pavimento está en buen estado?",
    assetKey: "pavimento-demarcacion",
    good: { alt: "Ejemplo de demarcación clara sobre pavimento en buen estado.", caption: "Demarcación clara, pavimento en buen estado." },
    bad: { alt: "Ejemplo de demarcación borrada y pavimento agrietado.", caption: "Demarcación borrada y pavimento agrietado." },
  },
];
