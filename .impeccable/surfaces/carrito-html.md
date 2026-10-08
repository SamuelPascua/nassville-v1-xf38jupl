---
version: 1
slug: "carrito-html"
primary_target: "carrito.html"
related_targets: ["js/cart.js","js/checkout.js","js/bag-store.js"]
---

# Surface: carrito.html (la bolsa)

Mode: Operate. Visitor arrives from the shop's bag button with garments already added (product + colour + size + quantity, persisted in localStorage `nassville-bag`). Job: review what is in the bag, mark which pieces to buy now, adjust quantity within stock, remove, then pay only the marked ones. Unmarked pieces stay saved in the bag.

Confirmed answers (2026-10-08): quantity per line (− n +, capped at the size's stock; adding the same product+colour+size again raises the quantity); "Pagar" opens our own screen with order summary + shipping data and the payment-gateway slot ready to connect (no gateway yet: the final button must say plainly that nothing is charged); shipping cost shows "se calcula al pagar", never an invented price. The user will be taught later how payments work.

Unresolved: real payment provider, shipping rates, real stock/prices (data.js is example data).

## Direction contract
THESIS: the bag as a fitting room. The garments you added hang in a row as big photos you swipe through; you tick the ones you take to the till and the rest step back onto the rail. Refuses the default stacked cart table with a side summary.
OWN-WORLD: nassville's message thread on navy: pearl incoming bubble for the title, bubble-cornered 4:5 photo cards on navy-700, round chat-select checks that fill Sent Blue, display caps names, serif garment type, tabular prices, the composer pill reborn as the pay bar.
STORY: visitor sees every piece at photo scale, understands at a glance which are marked and what they cost together, changes quantity or removes in place, then pays only the marked ones; the checkout screen keeps the same bubble materials and tells the truth about payments not being live.
FIRST VIEWPORT: chat bar; pearl title bubble "Tu bolsa" with a one-line lede and the marked count + "Marcar todo" chip; below it the horizontal rail of photo cards (about 300px wide on desktop, 74vw on mobile with the next card peeking), each with a round check top-left, remove top-right, name/type/colour·size, quantity stepper and line price; fixed at the bottom, the pay bar pill: "2 prendas · 130 €" + Sent Blue "Pagar 130 €".
FORM: "El probador", position 7 of 7 on the ordered list, seed key 9f78bd13. Signature move: ticking a garment brings its card forward (full colour, scale 1) while unticked ones step back (desaturated, scale 0.96); the pay bar's total rolls like the bag counter.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
