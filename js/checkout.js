/* nassville® — el punto de conexión con la pasarela de pago.
 *
 * Estado actual: NO HAY PASARELA CONECTADA. Ningún pedido se cobra.
 *
 * carrito.html construye el pedido (solo las prendas marcadas, con sus datos
 * de envío) y llama a NassCheckout.start(order). Hoy esa llamada responde que
 * los pagos no están activos y la página lo dice tal cual al visitante.
 *
 * Para activar los pagos se cambia SOLO este archivo (y se añade el servidor
 * que haga falta). El pedido que llega aquí tiene esta forma:
 *
 *   {
 *     lines: [{ id, name, type, color, size, qty, unitPrice, lineTotal }],
 *     subtotal: 130,            // en euros, IVA incluido
 *     currency: "EUR",
 *     contact:  { email, tel },
 *     shipping: { nombre, apellidos, direccion, direccion2, cp, ciudad, provincia, pais }
 *   }
 *
 * Importante para cuando se conecte: los precios NUNCA se fían del navegador.
 * El servidor (o la función de la pasarela) vuelve a calcular el importe a
 * partir de id + talla + cantidad con los precios reales; lo que manda esta
 * página es solo la lista de prendas.
 */
(function () {
  "use strict";

  var config = {
    // proveedor: null mientras no haya pasarela (p. ej. "stripe", "redsys", "paypal")
    provider: null
  };

  function start(order) {
    if (!config.provider) {
      return Promise.reject({ code: "not-configured", order: order });
    }
    // Aquí irá la llamada real, por ejemplo:
    //   fetch("/api/crear-pago", { method: "POST", body: JSON.stringify(order) })
    //     .then(r => r.json())
    //     .then(data => { window.location = data.url; });   // la pasarela pide la tarjeta
    return Promise.reject({ code: "not-implemented", order: order });
  }

  window.NassCheckout = {
    start: start,
    isLive: function () { return !!config.provider; }
  };
})();
