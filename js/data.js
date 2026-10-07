/*
 * Catálogo y drops de nassville (v1).
 *
 * IMPORTANTE: precios, tallas y stock son DATOS DE EJEMPLO.
 * Sustituirlos por los reales antes de publicar.
 *
 * stock por talla: 0 = agotada, 1-3 = últimas unidades, >3 = disponible.
 * images: fotos de la prenda (sola o con modelo) para deslizar y ver en grande.
 * video: fondo de la vista ampliada (start = segundo de inicio); tint: color del filtro.
 */
window.NASS = {
  products: [
    {
      id: "losing-interest-crewneck",
      name: "Losing Interest",
      type: "Crewneck",
      category: "sudaderas",
      drop: "losing-interest",
      desc: "Oversize navy. Bordado delante y serigrafía gigante detrás.",
      price: 55,
      colorways: [
        {
          name: "Navy",
          images: ["DQ6ai3OCIwG-2.jpg", "DQ6ai3OCIwG-4.jpg", "DQ6ai3OCIwG-5.jpg", "DQ6ai3OCIwG-3.jpg", "DQ6awDBiDKX-3.jpg", "DQ6ai3OCIwG.jpg", "DQ6awDBiDKX-4.jpg", "DQ6aqPhCNO7-7.jpg", "DQ_jUEKCJ6J-5.jpg", "DQ_jUEKCJ6J-4.jpg", "DQ_jUEKCJ6J.jpg", "DSz7F5_iDeO.jpg"],
          video: { src: "Dc6hz_ooqou" },
          tint: "#2a3a8c",
          stock: { S: 0, M: 2, L: 6, XL: 3 }
        }
      ]
    },
    {
      id: "nass-zip-up",
      name: "NASS Zip-Up",
      type: "Zip hoodie",
      category: "sudaderas",
      drop: "nass",
      price: 75,
      colorways: [
        {
          name: "Brown washed",
          images: ["DZpqpVXiM4U-2.jpg", "DZpqpVXiM4U.jpg", "DZpqpVXiM4U-3.jpg", "DZF4fGhCOD9-3.jpg", "DZF4fGhCOD9.jpg", "DZF4fGhCOD9-2.jpg", "Dbdkoc_CCcC.jpg", "Dbdkoc_CCcC-3.jpg", "DYjpaJziJEB-2.jpg"],
          video: { src: "DYUDJ-aR84h", start: 30 },
          tint: "#7a5236",
          stock: { S: 4, M: 5, L: 1, XL: 0 }
        },
        {
          name: "Olive washed",
          images: ["DYUDHm_CC5l.jpg", "DYUDHQyiAkA-5.jpg", "DYUDHQyiAkA.jpg", "DYUDHQyiAkA-2.jpg", "DYUDHQyiAkA-6.jpg", "DYUDHQyiAkA-4.jpg", "DYUDHQyiAkA-3.jpg", "DYUDHm_CC5l-2.jpg"],
          video: { src: "DYUDJ-aR84h", start: 30 },
          tint: "#6f6a3c",
          stock: { S: 0, M: 0, L: 0, XL: 0 }
        }
      ]
    },
    {
      id: "toppings-tee",
      name: "Toppings",
      type: "Boxy tee",
      category: "camisetas",
      drop: "toppings",
      desc: "Boxy fit, 195 GSM, 100% algodón.",
      price: 35,
      colorways: [
        {
          name: "Cream",
          images: ["DNJDF6FIfKv-2.jpg", "DNJDF6FIfKv.jpg", "DLfqI2MoGwb-2.jpg", "DLfqI2MoGwb-3.jpg", "DNBLCdfoB7N.jpg", "DaAwdtOCP5l-3.jpg"],
          video: { src: "DNBLGHuIDVZ" },
          tint: "#2e9b55",
          stock: { S: 5, M: 8, L: 7, XL: 2 }
        }
      ]
    },
    {
      id: "almozara-kit",
      name: "CD La Almozara",
      type: "Equipación 25/26",
      category: "camisetas",
      drop: "almozara",
      price: 60,
      colorways: [
        {
          name: "Navy",
          images: ["DRCKPUsiIOW-4.jpg", "DRCKPUsiIOW-2.jpg", "DRCKPUsiIOW-3.jpg", "DRCKPUsiIOW.jpg"],
          video: { src: "DQ6aekxiN1R", start: 20 },
          tint: "#1e5bd6",
          stock: { S: 3, M: 6, L: 6, XL: 4 }
        }
      ]
    },
    {
      id: "washed-hoodie",
      name: "NASS Hoodie",
      type: "Hoodie lavada",
      category: "sudaderas",
      drop: "nass",
      price: 70,
      colorways: [
        {
          name: "Washed grey",
          images: ["DXjCNpUiHGI-3.jpg"],
          video: { src: "DXjCNpUiHGI-5" },
          tint: "#7a7a82",
          stock: { S: 2, M: 3, L: 3, XL: 1 }
        }
      ]
    },
    {
      id: "50003-tee",
      name: "50003",
      type: "Boxy tee",
      category: "camisetas",
      drop: "50003",
      price: 35,
      colorways: [
        {
          name: "Charcoal",
          images: ["DIlode2oLMI.jpg", "DIlode2oLMI-2.jpg", "DLfqKT4ILU7.jpg", "DGqSayZImc2.jpg", "DHJISclIC7f.jpg"],
          video: { src: "DL7bctRIjTd" },
          tint: "#4a4a55",
          stock: { S: 0, M: 0, L: 0, XL: 0 }
        },
        {
          name: "Black",
          images: ["DHJISclIC7f.jpg", "DLfqI2MoGwb.jpg", "DaAwdtOCP5l-2.jpg"],
          video: { src: "DL7bctRIjTd" },
          tint: "#26262c",
          stock: { S: 0, M: 0, L: 0, XL: 0 }
        }
      ]
    },
    {
      id: "mascu",
      name: "Mascu",
      type: "Figura de colección",
      category: "objetos",
      drop: "mascu",
      price: 30,
      colorways: [
        {
          name: "Edición limitada",
          images: ["DRsAAoPiDvX-4.jpg", "DRsAAoPiDvX-3.jpg", "DRsAAoPiDvX-5.jpg"],
          video: { src: "DXjCCKQiGWc", start: 40 },
          tint: "#2f6f86",
          stock: { "Única": 0 }
        }
      ]
    }
  ],

  /* El hilo: del más antiguo (arriba) al más reciente (abajo). */
  drops: [
    {
      id: "50003",
      stamp: "",
      title: "50003",
      lines: ["nassville arrives in Milano.", "Design Brand Official Site. Boxy, 195 GSM, todo algodón."],
      images: ["DGqSayZImc2.jpg", "DGqSayZImc2-2.jpg", "DIlode2oLMI.jpg", "DLfqKT4ILU7.jpg"],
      video: { src: "DL7bctRIjTd", ratio: "9/16" }
    },
    {
      id: "toppings",
      stamp: "",
      title: "Toppings",
      lines: ["Verano. Everything taste much better by adding some toppings.", "The details make the difference."],
      images: ["DNJDF6FIfKv-2.jpg", "DLfqI2MoGwb-3.jpg", "DNBLCdfoB7N.jpg", "DNJDF6FIfKv-3.jpg", "DLfqI2MoGwb-4.jpg"],
      video: { src: "DNBLGHuIDVZ", ratio: "9/16" }
    },
    {
      id: "losing-interest",
      stamp: "jue, 29 oct · 22:05",
      title: "Losing Interest",
      lead: true,
      lines: ["me vas a matar pero...", "Losing Interest. New drop. Navy, oversize, bordado delante y serigrafía gigante detrás."],
      images: ["DQ6aqPhCNO7-7.jpg", "DQ6aqPhCNO7.jpg", "DQ6awDBiDKX-3.jpg", "DQ_jUEKCJ6J-4.jpg", "DQ6aqPhCNO7-5.jpg", "DQ6awDBiDKX-4.jpg", "DQ_jUEKCJ6J-5.jpg", "DQ6aqPhCNO7-8.jpg"],
      video: { src: "DQ6aqPhCNO7-6", ratio: "3/4" }
    },
    {
      id: "almozara",
      stamp: "",
      title: "CD La Almozara",
      lines: ["Equipación CD La Almozara, Zaragoza. nassville brand official design.", "El barrio también juega."],
      images: ["DRCKPUsiIOW-2.jpg", "DRCKPUsiIOW-3.jpg", "DRCKPUsiIOW.jpg", "DRCKPUsiIOW-4.jpg"]
    },
    {
      id: "mascu",
      stamp: "",
      title: "Mascu",
      lines: ["Sorteo Black Friday.", "Mascu se vino a vivir con nosotros."],
      images: ["DRsAAoPiDvX-3.jpg", "DRsAAoPiDvX-4.jpg", "DRfVckdiCQq-3.jpg", "DRsAAoPiDvX-2.jpg"]
    },
    {
      id: "egipto",
      stamp: "",
      title: "Egipto",
      lines: ["Giza. Nos llevamos la navy a ver las pirámides."],
      images: ["DSz7F5_iDeO.jpg", "DSz7F5_iDeO-4.jpg", "DSz7F5_iDeO-2.jpg", "DSz7F5_iDeO-5.jpg"],
      video: { src: "DSz7F5_iDeO-6", ratio: "3/4" }
    },
    {
      id: "nass",
      stamp: "06 de mayo",
      title: "NASS Zip-Up",
      lines: ["Exclusive new zip-up.", "Born to belive."],
      images: ["DYUDHQyiAkA-5.jpg", "DZF4fGhCOD9.jpg", "DYUDHQyiAkA-2.jpg", "DZpqpVXiM4U-3.jpg", "DZF4fGhCOD9-3.jpg", "DYUDHQyiAkA-4.jpg"],
      video: { src: "DYUDJ-aR84h", ratio: "16/9", start: 30 }
    },
    {
      id: "popup",
      stamp: "12 de junio · 19:00",
      title: "Pop Up",
      lines: ["Pop up en Tierra y Fuego, Parque Macanaz.", "Junto a las mejores marcas de Zaragoza."],
      images: ["DZQHwcjCDXU.jpg", "DZQHwcjCDXU-2.jpg"]
    },
    {
      id: "summer",
      stamp: "",
      title: "Actuamos primero",
      lines: ["Summer favs. Actuamos primero, pensamos después, nos lamentamos: nunca."],
      images: ["DaAwdtOCP5l.jpg", "DaAwdtOCP5l-2.jpg", "DaAwdtOCP5l-3.jpg", "Dbdkoc_CCcC.jpg", "Dbdkoc_CCcC-3.jpg"]
    }
  ],

  /*
   * Chat del grupo "nassville drops".
   * IMPORTANTE: las personas, mensajes, horas y reacciones de la comunidad son
   * DE EJEMPLO. Sustituirlos por reales (con permiso) o ajustarlos antes de publicar.
   */
  chat: {
    name: "nassville drops",
    members: "nassville, Lucía, Marcos, Irene y 1.247 más",
    pinned: { drop: "losing-interest", text: "Nuevo drop: Losing Interest. Ya disponible en la tienda." },
    users: {
      lucia: { name: "Lucía", color: "#f0a3c4" },
      marcos: { name: "Marcos", color: "#7fd6b8" },
      irene: { name: "Irene", color: "#f5c27a" },
      dani: { name: "Dani", color: "#9fb4ff" },
      hugo: { name: "Hugo", color: "#c9a6ff" },
      paula: { name: "Paula", color: "#8fd0f0" }
    },
    /* por drop: hora de nassville, reacciones a su mensaje y respuestas.
       quote: true = cita el último mensaje de nassville del drop; quote: 0, 1… = cita esa frase;
       reply: "usuario" = nassville responde citando a esa persona. */
    drops: {
      "50003": {
        time: "20:30", reactions: [["🔥", 18], ["🙌", 6]],
        replies: [
          { user: "lucia", time: "20:32", quote: true, text: "ese 50003 en gris es una locura" },
          { from: "nassville", time: "20:35", reply: "lucia", text: "Gracias Lucía 🖤 boxy y 195 GSM, pensada para durar" }
        ]
      },
      "toppings": {
        time: "19:00", reactions: [["🍋", 11], ["🔥", 9]],
        replies: [
          { user: "marcos", time: "19:04", quote: true, text: "¿la Toppings queda en M?" },
          { from: "nassville", time: "19:06", reply: "marcos", text: "Queda en M, corre 🏃" }
        ]
      },
      "losing-interest": {
        time: "22:05", reactions: [["🔥", 54], ["😭", 21], ["🖤", 17]],
        replies: [
          { user: "irene", time: "22:06", quote: 0, text: "me vas a matar tú a mí 😭 la navy es preciosa" },
          { user: "dani", time: "22:07", text: "¿el bordado va delante?" },
          { from: "nassville", time: "22:09", reply: "dani", text: "Sí 🙌 bordado delante y serigrafía gigante detrás" }
        ]
      },
      "almozara": {
        time: "18:15", reactions: [["⚽", 23], ["💙", 12]],
        replies: [
          { user: "hugo", time: "18:20", text: "por fin una equipación del barrio" }
        ]
      },
      "mascu": {
        time: "21:00", reactions: [["🧸", 15], ["😍", 9]],
        replies: [
          { user: "paula", time: "21:12", quote: true, text: "me quedé sin Mascu 😭" },
          { from: "nassville", time: "21:15", reply: "paula", text: "Se fue volando 🫡 avisaremos si vuelve" }
        ]
      },
      "egipto": {
        time: "17:40", reactions: [["🐪", 19], ["😂", 14]],
        replies: [
          { user: "lucia", time: "17:42", text: "¿esto es real? 😂" }
        ]
      },
      "nass": {
        time: "20:00", reactions: [["🔥", 31], ["🤎", 13]],
        replies: [
          { user: "marcos", time: "20:01", quote: true, text: "el zip marrón 🔥🔥" },
          { user: "irene", time: "20:03", text: "yo voy a por la olive" }
        ]
      },
      "popup": {
        time: "12:00", reactions: [["📍", 8], ["🙌", 11]],
        replies: [
          { user: "dani", time: "12:10", text: "allí estaremos" }
        ]
      },
      "summer": {
        time: "13:30", reactions: [["🤝", 16]],
        replies: [
          { user: "irene", time: "13:31", quote: true, text: "nunca 🤝" }
        ]
      }
    },
    autoReply: "¡Te leemos! 🙌 Para enterarte del próximo drop antes que nadie, deja tu email aquí abajo."
  },

  /* Vídeos redondos (notas de vídeo) y películas */
  notes: ["DSz7F5_iDeO-3", "DQ_jUEKCJ6J-8", "DXjCNpUiHGI-2", "DSSpv1FCEN-", "DK2M5QNoEAw", "DSz7F5_iDeO-6"],
  films: [
    { src: "Dc6hz_ooqou", title: "Losing Interest", note: "Película de campaña" },
        { src: "DdL5jSjIFfg", title: "End of season", note: "Thank you" },
    { src: "DQ6aekxiN1R", title: "No, yo no puedo", note: "Corto · Almozara y Losing Interest" }
  ],

  social: {
    instagram: "https://www.instagram.com/nassville.inc/",
    handle: "@nassville.inc",
    web: "nassville.com",
    feed: ["DQ6aqPhCNO7-2.jpg", "DZF4fGhCOD9-2.jpg", "DSz7F5_iDeO-4.jpg", "DNBLCdfoB7N-3.jpg", "DQ_jUEKCJ6J.jpg", "DYUDHm_CC5l-3.jpg", "DRJ8EnBiPA-.jpg", "Dbdkoc_CCcC-5.jpg", "DQ6awDBiDKX-5.jpg"]
  }
};
