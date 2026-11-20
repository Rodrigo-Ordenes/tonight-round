/**
 * Contenido de Party Games. Preguntas pensadas para carretes en Chile: nada humillante, nada sobre el cuerpo y nada
 * que empuje a tomar.
 */

/** «La mayoría gana»: una pregunta con cuatro alternativas; se predice qué elegirá la mayoría y después se responde */
export const MAYORIA: { q: string; options: [string, string, string, string] }[] = [
  { q: "¿Qué prefieren para una fiesta?", options: ["Playa", "Piscina", "Casa", "Discoteca"] },
  { q: "¿El mejor completo lleva…?", options: ["Italiano", "Dinámico", "Chacarero", "Solo con mayo"] },
  { q: "¿A qué hora empieza de verdad un carrete?", options: ["Antes de las 22", "22 a 23", "23 a 00", "Después de las 00"] },
  { q: "¿Qué canción no puede faltar?", options: ["Reggaetón antiguo", "Cumbia", "Rock en español", "Pop de los 2000"] },
  { q: "¿Mejor plan para un domingo?", options: ["Dormir todo el día", "Asado", "Cine o serie", "Salir a caminar"] },
  { q: "¿Qué superpoder elegirían?", options: ["Volar", "Teletransportarse", "Leer mentes", "Ser invisible"] },
  { q: "¿Dónde harían el próximo viaje?", options: ["Norte de Chile", "Sur de Chile", "Brasil", "Europa"] },
  { q: "¿Qué snack manda en la previa?", options: ["Papas fritas", "Maní", "Ramitas", "Sopaipillas"] },
  { q: "¿Mascota ideal?", options: ["Perro", "Gato", "Ninguna", "Algo exótico"] },
  { q: "¿Qué harían con un millón de pesos ahora?", options: ["Viajar", "Ahorrar", "Una fiesta", "Pagar deudas"] },
  { q: "¿La mejor parte de un carrete?", options: ["La previa", "El baile", "Las conversaciones", "El bajón de las 3"] },
  { q: "¿Qué estación del año prefieren?", options: ["Verano", "Otoño", "Invierno", "Primavera"] },
];

/** «Predice el porcentaje»: preguntas de sí o no sobre el grupo */
export const PORCENTAJE: string[] = [
  "¿Han viajado fuera de Chile?",
  "¿Saben cocinar un plato completo sin receta?",
  "¿Se han quedado dormidos en un carrete?",
  "¿Tienen una canción que se saben de memoria entera?",
  "¿Han cantado en un karaoke?",
  "¿Siguen en contacto con alguien del colegio?",
  "¿Han perdido el celular en una fiesta?",
  "¿Prefieren el campo antes que la ciudad?",
  "¿Han hecho un viaje solos?",
  "¿Saben andar en bicicleta sin manos?",
  "¿Tienen un apodo que odian?",
  "¿Han llegado tarde a su propio cumpleaños?",
];

/** «El mentiroso»: todos responden en voz alta con la verdad, menos quien recibe la orden de inventar */
export const MENTIROSO: string[] = [
  "Cuenta tu peor viaje en micro o metro.",
  "¿Cuál fue tu primer trabajo y qué tal te fue?",
  "Cuenta la comida más rara que has probado.",
  "¿Cuál fue tu peor corte de pelo y por qué?",
  "Cuenta el regalo más raro que te han hecho.",
  "¿Qué es lo más vergonzoso que te pasó en el colegio?",
  "Cuenta una vez que te perdiste en un lugar.",
  "¿Cuál fue tu primer concierto?",
  "Cuenta la mejor excusa que has inventado para no ir a algo.",
  "¿Qué talento escondido tienes?",
];

/** «El infiltrado»: casi todos reciben la primera palabra; el infiltrado, la segunda (parecida, no igual) */
export const INFILTRADO: [string, string][] = [
  ["Playa", "Piscina"],
  ["Completo", "Hamburguesa"],
  ["Metro", "Micro"],
  ["Cumpleaños", "Matrimonio"],
  ["Perro", "Gato"],
  ["Guitarra", "Piano"],
  ["Cine", "Teatro"],
  ["Asado", "Picnic"],
  ["Nieve", "Lluvia"],
  ["Fútbol", "Básquetbol"],
  ["Hospital", "Farmacia"],
  ["Avión", "Helicóptero"],
  ["Café", "Té"],
  ["Celular", "Computador"],
];

/** «Último en pie»: colores y figuras para las instrucciones rápidas (se dibujan en el celular) */
export const ULTIMO_COLORES = [
  { id: "azul", label: "azul", css: "var(--blue)" },
  { id: "morado", label: "morado", css: "var(--violet)" },
  { id: "menta", label: "menta", css: "var(--signal)" },
  { id: "ambar", label: "ámbar", css: "#E4B853" },
] as const;
export const ULTIMO_FIGURAS = ["círculo", "cuadrado", "triángulo", "estrella"] as const;
