# Publicar nassville en su dominio (nassville.com)

Lista de comprobación para pasar de la versión de prueba
(`https://samuelpascua.github.io/nassville-v1-xf38jupl/`) al dominio público. Ve marcando en orden.

## 0. Antes de abrir (obligatorio)

- [ ] Rellenar todos los datos marcados en amarillo (`<mark class="todo">`) en `privacidad.html`,
      `terminos.html` y el pie de `index.html`: titular, NIF/CIF, dirección, email, proveedor de
      email, transporte, coste de envío y métodos de pago. Comprobarlo con:
      `grep -n 'class="todo"' *.html` → no debe salir nada.
- [ ] Quitar el aviso amarillo «Pendiente antes de publicar / vender» (`<aside class="legal__todo">`)
      de privacidad y términos.
- [ ] Precios, tallas y stock reales en `js/data.js`; quitar «v1 · precios y stock de ejemplo» del pie.
- [ ] Mensajes reales en el chat del hilo (`js/data.js`, `chat`) o quitar los de ejemplo.
- [ ] El formulario de email conectado al proveedor (ahora no envía nada).
- [ ] Si todavía no hay pasarela de pago: decidir si el carrito se queda visible (no cobra nada y lo
      dice) o se oculta el botón de la bolsa hasta que se pueda comprar.

## 1. Dominio

- [ ] Comprar o confirmar `nassville.com` **a nombre del titular** de la tienda.
- [ ] Decidir si la web principal es `nassville.com` o `www.nassville.com` (la web ya está preparada
      para `https://nassville.com/`; si se elige `www`, cambiar las URLs de los `canonical`, `og:` y
      `sitemap.xml`).

## 2. Alojamiento en GitHub Pages (el actual)

- [ ] En la rama `gh-pages`, añadir un archivo `CNAME` cuyo contenido sea solo `nassville.com`.
- [ ] En GitHub → repositorio → Settings → Pages → Custom domain: `nassville.com` → Save.
- [ ] Recomendado: verificar el dominio en GitHub (Settings de la cuenta → Pages → Add a domain), así
      nadie más puede usarlo en GitHub.
- [ ] Opcional: cambiar el nombre del repositorio por uno normal (`nassville-web`). Ya no hace falta
      que sea difícil de adivinar.

## 3. DNS (en el panel del registrador del dominio)

| Tipo | Nombre | Valor |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | samuelpascua.github.io |

- [ ] Borrar los registros A/AAAA antiguos que traiga el registrador (página de aparcamiento).
- [ ] Esperar a que propaguen (de minutos a 24 h). Comprobarlo con `nslookup nassville.com`.
- [ ] En Settings → Pages, marcar **Enforce HTTPS** en cuanto GitHub lo deje (cuando termine de
      emitir el certificado).

## 4. Abrir la web a los buscadores

- [ ] Quitar `<meta name="robots" content="noindex, nofollow, noarchive">` (y el comentario
      «versión de prueba» de encima) de `index.html`, `privacidad.html`, `terminos.html` y
      `cookies.html`.
- [ ] `carrito.html`: **dejarle** el `noindex` (una bolsa vacía no aporta nada en Google).
- [ ] `robots.txt`, sustituir todo por:

      User-agent: *
      Allow: /
      Sitemap: https://nassville.com/sitemap.xml

- [ ] Subir la versión de caché (`?v=`) en todas las páginas y volver a montar `gh-pages`.
- [ ] Dar de alta el dominio en Google Search Console y enviar el `sitemap.xml`.

## 5. Comprobar

- [ ] `https://nassville.com` carga con candado y `http://` y `www.` redirigen a él.
- [ ] Compartir el enlace por WhatsApp: tiene que salir la foto de campaña (`assets/og.jpg`) con el
      título. Si sale una vista previa antigua, probar con
      `https://nassville.com/?v=2`.
- [ ] Cambiar el enlace de la bio de Instagram (@nassville.inc) a `https://nassville.com`.
- [ ] Si se cambia de alojamiento (Netlify, Vercel, Cloudflare…), actualizar «Alojamiento de la web» en
      `privacidad.html` §4 y §5.

## Cuando llegue la venta online

- [ ] Pasarela conectada (`js/checkout.js`, `provider`) y tarifas de envío reales.
- [ ] Pasarela y transportista nombrados en privacidad y términos.
- [ ] Si se añaden Google Analytics o el píxel de Meta: volver a poner el aviso de cookies **antes** de
      activarlos (está en el historial de git, commit `6c93700`, archivo `js/consent.js`) y actualizar
      `cookies.html`.
