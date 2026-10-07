/*
 * Catálogo y drops de nassville (v1).
 *
 * IMPORTANTE: precios, tallas y stock son DATOS DE EJEMPLO.
 * Sustituirlos por los reales antes de publicar.
 *
 * stock por talla: 0 = agotada, 1-3 = últimas unidades, >3 = disponible.
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
          images: ["DQ6ai3OCIwG-2.jpg", "DQ6ai3OCIwG-4.jpg", "DQ6ai3OCIwG-5.jpg", "DQ6ai3OCIwG-3.jpg"],
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
          images: ["DZpqpVXiM4U-2.jpg", "DZpqpVXiM4U.jpg", "DZpqpVXiM4U-3.jpg"],
          stock: { S: 4, M: 5, L: 1, XL: 0 }
        },
        {
          name: "Olive washed",
          images: ["DYUDHm_CC5l.jpg", "DYUDHQyiAkA-6.jpg", "DYUDHQyiAkA-5.jpg"],
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
          images: ["DNJDF6FIfKv-2.jpg", "DLfqI2MoGwb-2.jpg", "DNJDF6FIfKv.jpg"],
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
          images: ["DRCKPUsiIOW-4.jpg", "DRCKPUsiIOW-2.jpg", "DRCKPUsiIOW-3.jpg"],
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
          images: ["DIlode2oLMI.jpg", "DLfqKT4ILU7.jpg", "DIlode2oLMI-2.jpg"],
          stock: { S: 0, M: 0, L: 0, XL: 0 }
        },
        {
          name: "Black",
          images: ["DHJISclIC7f.jpg", "DLfqI2MoGwb.jpg"],
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
          images: ["DRsAAoPiDvX-4.jpg", "DRsAAoPiDvX-5.jpg"],
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
