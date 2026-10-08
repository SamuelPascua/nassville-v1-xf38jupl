---
name: nassville
description: The store as the brand's message thread, on the navy of its logo.
colors:
  navy-950: "#0a0c24"
  navy-900: "#0f1233"
  navy-850: "#131740"
  navy-800: "#181d4a"
  navy-700: "#20265a"
  navy-600: "#262c57"
  navy-500: "#343b72"
  navy-400: "#4a5290"
  pearl: "#e4e4e8"
  pearl-strong: "#f3f3f6"
  ink-soft: "#b7bbdb"
  ink-faint: "#8d93c2"
  sent: "#3a63e0"
  sent-strong: "#7d9dff"
  line: "rgba(228, 228, 232, 0.12)"
  line-strong: "rgba(228, 228, 232, 0.22)"
typography:
  display:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(2.6rem, 6vw, 4.5rem)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.01em"
  display-xl:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(3.2rem, 9vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 900
    lineHeight: 0.86
    letterSpacing: "-0.005em"
  title:
    fontFamily: "Big Shoulders Display, Arial Narrow, sans-serif"
    fontSize: "2rem"
    fontWeight: 900
    lineHeight: 0.9
  serif-name:
    fontFamily: "Instrument Serif, Times New Roman, serif"
    fontSize: "clamp(4.2rem, 13vw, 11rem)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "-0.035em"
  serif-note:
    fontFamily: "Instrument Serif, Times New Roman, serif"
    fontSize: "1.15rem"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    fontFeature: "tnum"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 400
    lineHeight: 1.45
  meta:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.4
  ui:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Text, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 500
    lineHeight: 1.3
rounded:
  hairline: "2px"
  tight: "8px"
  tail: "6px"
  control: "12px"
  thumb: "15px"
  bubble: "22px"
  pill: "999px"
spacing:
  in-group: "4px"
  control-gap: "8px"
  bubble-pad: "12px 16px"
  gutter: "clamp(16px, 4vw, 48px)"
  section: "clamp(80px, 12vw, 160px)"
  between-drops: "clamp(72px, 10vw, 128px)"
  max: "1280px"
  bar: "64px"
components:
  bubble-in:
    backgroundColor: "{colors.pearl}"
    textColor: "{colors.navy-800}"
    rounded: "{rounded.bubble}"
    padding: "12px 16px"
  bubble-out:
    backgroundColor: "{colors.sent}"
    textColor: "#ffffff"
    rounded: "{rounded.bubble}"
    padding: "12px 16px"
  button-primary:
    backgroundColor: "{colors.pearl}"
    textColor: "{colors.navy-800}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.pearl-strong}"
  button-primary-in-bubble:
    backgroundColor: "{colors.navy-700}"
    textColor: "{colors.pearl}"
    rounded: "{rounded.pill}"
    height: "46px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.pearl}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "46px"
  button-sent:
    backgroundColor: "{colors.sent}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "46px"
  button-sent-hover:
    backgroundColor: "{colors.sent-strong}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.pearl}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "40px"
  chip-touch:
    height: "44px"
  chip-active:
    backgroundColor: "{colors.sent}"
    textColor: "#ffffff"
  size:
    textColor: "{colors.pearl}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "42px"
    width: "48px"
  size-touch:
    height: "44px"
  size-selected:
    backgroundColor: "{colors.pearl}"
    textColor: "{colors.navy-800}"
  linkcard:
    backgroundColor: "{colors.pearl}"
    textColor: "{colors.navy-800}"
    rounded: "{rounded.bubble}"
    padding: "8px 14px 8px 8px"
    width: "400px"
  product-card:
    backgroundColor: "{colors.navy-700}"
    textColor: "{colors.pearl}"
    rounded: "{rounded.bubble}"
    padding: "18px 18px 20px"
  composer:
    backgroundColor: "{colors.navy-800}"
    textColor: "{colors.pearl}"
    rounded: "{rounded.pill}"
    padding: "6px 6px 6px 20px"
    height: "56px"
  notify-popover:
    backgroundColor: "{colors.navy-900}"
    textColor: "{colors.pearl}"
    rounded: "{rounded.bubble}"
    padding: "16px 16px 18px"
    width: "440px"
---

# Design System: nassville

## Overview

**Creative North Star: "The Message Thread"**

The whole store is nassville's chat with its followers, laid on the navy of the logo. Every drop arrives as a message with attachments, every garment as a link preview, every sell-out as "Leído". Content speaks in two materials only: pearl incoming bubbles with navy text (the brand talking) and a muted electric blue for anything the visitor sends or acts on. Everything else is navy depth.

Type carries the streetwear register against that quiet chat material: a heavy condensed display face (Big Shoulders Display, 900, uppercase) for drop and section titles, a condensed italic serif (Instrument Serif) for collection names and asides, and the device's own system stack for body text, because that is what a real chat is set in. Campaign photos and films are the proof and appear as attachments with bubble corners, never as a decorative hero grid.

Motion follows the grammar of messages arriving: a typing indicator, then bubbles that rise, unblur and settle from their bottom-left origin, staggered 70 ms apart. The 3D "11" emblem in the hero follows the cursor on springs. Density is low on mobile (one column, generous gaps between drops) and the thread runs down a single vertical axis of dates.

**Key Characteristics:**
- Navy ground (#131740 body, #0f1233 hero) with pearl incoming bubbles and one blue accent.
- Bubble geometry everywhere content lives: 22px corners with one 6px "tail" corner, bottom-left for incoming.
- Display 900 uppercase titles against an italic serif for proper names.
- Timestamps, read receipts and "Entregado" as the metadata layer, in tabular numerals.
- Arrival motion (typing, then rise-and-unblur) instead of generic fade-ins.

## Colors

A single-hue navy world lit by pearl and one muted electric blue.

### Primary
- **Sent Blue** (sent): the only accent. Outgoing bubbles, the active filter chip, "low stock" tags and dots, the lead drop's axis marker, the composer send button, the bag count. It means "this is you / this is live".
- **Sent Blue Light** (sent-strong): the same blue lifted for use as text or line on navy: focus rings, the read-receipt "Leído" text, the manifesto's last word, hover on sent buttons.

### Neutral
- **Pearl** (pearl): the brand's speaking voice. Incoming bubble fill, primary buttons, link-preview cards, selected size, toast; also all primary text on navy.
- **Pearl Bright** (pearl-strong): hover state of pearl surfaces.
- **Navy 950 to 400** (navy-950 ... navy-400): the logo ground as an 8-step depth scale. 850 is the page; 900 the hero and nav glass; 800 is text on pearl and the composer field; 700 the product card and media placeholders; 600 is the logo ground (avatar, colour-blend tint on the hero video, footer wordmark); 500 and 400 are muted text on pearl (stamps, spec labels) and scrollbar/typing dots.
- **Mist** (ink-soft): secondary text on navy (ledes, nav links, product type, descriptions).
- **Haze** (ink-faint): timestamps, receipts, legends, placeholder text on navy.
- **Hairline / Hairline Strong** (line, line-strong): 12% and 22% pearl strokes for dividers, ghost-button and chip outlines, the thread axis.

### Named Rules
**The One Blue Rule.** Sent Blue is the only chromatic accent and always means the visitor's side of the conversation or a live state (active, low stock, focus). It is never used for decoration or display type.

**The Two Speakers Rule.** Brand content sits on pearl with navy text; visitor actions sit on blue with white text. A surface that is neither stays navy.

## Typography

**Display Font:** Big Shoulders Display 700/800/900 (with Arial Narrow)
**Serif Font:** Instrument Serif italic 400 (with Times New Roman)
**Body Font:** system UI stack (-apple-system, Segoe UI, Roboto...)

**Character:** Condensed, shouting display caps for drops and prices, against a soft italic serif that names collections, over the plain chat type of the phone the audience is holding.

### Hierarchy
- **Display XL** (900, clamp(3.2rem, 9vw, 6rem), 0.86, uppercase): section titles that sit alone ("Lo que queda", "Notas de vídeo", "Síguenos"). The thread head and manifesto push larger (up to 10rem / 8rem).
- **Display** (900, clamp(2.6rem, 6vw, 4.5rem), 0.86, uppercase, balanced): default section heads, archive head.
- **Serif Name** (Instrument Serif italic 400, clamp(4.2rem, 13vw, 11rem), 0.82, -0.035em): the current drop's name only, and the manifesto's last word. The lead drop is named in serif; every older drop in display caps.
- **Headline** (900, clamp(2rem, 4vw, 3rem), uppercase): titles of non-lead drops in the thread.
- **Title** (900, 2rem, 0.9, uppercase): product names; prices use 800 at 1.7rem with tabular numerals. Film titles and archive names follow the same face at their own size.
- **Serif Note** (italic 400, 1.1 to 1.6rem, ink-soft): garment type, film notes, archive aside, the Instagram handle.
- **Body** (400, 17px desktop / 16px under 720px, 1.45): bubbles at 1rem / 1.4; ledes 1.05rem capped at 42ch.
- **Label** (600, 0.75rem, tabular numerals; 0.72rem when tracked uppercase): timestamps, receipts, tags, legends.
- **Caption** (400, 0.8rem): legal footnotes, size legends, the shop's state line under the button.
- **Meta** (400, 0.85rem, ink-soft): secondary lines under a name (sheet meta, popover meta, link-card host and price), form errors.
- **UI** (500, 0.9rem): compact controls and nav links: chips, sizes, swatches' bigger siblings, chat bar links.

### Named Rules
**The Proper Names Rule.** Instrument Serif italic is reserved for names (collections, garment types, films, the handle) and the single punchline word. It is never a body face.

**The Four Small Steps Rule.** Text under body size uses only Label, Caption, Meta and UI (0.75 / 0.8 / 0.85 / 0.9rem). A new small size is a near-duplicate of one of these, not a fifth step.

**The Chat Material Rule.** Running text and UI controls use the system stack, not the display face; display caps are for titles, product names, prices, spec values and the mobile menu.

## Layout

Single centred column capped at 1280px with a fluid gutter (clamp(16px, 4vw, 48px)); every section opens with clamp(80px, 12vw, 160px) of top space. A fixed 64px chat bar sits over everything; scroll padding accounts for it.

The thread is an ordered list down a 1px vertical axis (gradient from line-strong to transparent) with a 9px dot per drop; the lead drop's dot is filled Sent Blue with a 4px halo. Drops are separated by clamp(72px, 10vw, 128px); inside a drop, consecutive bubbles sit 4px apart (grouped messages). At 960px and up, non-lead drops become a two-column row: a sticky title rail (220 to 300px) beside the message body; the lead drop stays full-width.

The shop is an auto-fill grid of cards (min 290px, gap clamp(16px, 2vw, 24px)); at 900px and up the lead product spans two columns as a media/info split. Sold-out items leave the grid for a dense archive list (52px thumb, name, struck-through price, "Leído").

Breakpoints as built: 720px (mobile type size, tall hero video, two-column lead attachments, tighter thread axis), 800px (films two-up), 860px (nav collapses into a menu sheet), 900px (section heads split title/lede, lead product spans two, about and social go two-column), 960px (sticky drop rails).

## Elevation & Depth

Hybrid: depth comes mostly from the navy scale (page 850, cards 700, field 800, footer gradient 850 to 950) plus two soft, dark, negative-spread shadows that lift bubbles and media off the ground. Glass (blurred, translucent navy) appears only on the scrolled chat bar, the menu sheet, video badges and dialog backdrops. Outlines are inset hairlines rather than borders.

### Shadow Vocabulary
- **Bubble lift** (`0 1px 2px rgba(5,6,20,0.35), 0 8px 24px -8px rgba(5,6,20,0.55)`): bubbles, typing indicator, link cards, product cards.
- **Attachment lift** (`0 2px 6px rgba(5,6,20,0.35), 0 24px 60px -20px rgba(5,6,20,0.75)`): photo and video attachments, films, about photo, feed, dialogs, toast.
- **Hairline ring** (`inset 0 0 0 1px` line / line-strong): ghost buttons, chips, sizes, the composer, product card edge.

### Named Rules
**The Soft Lift Rule.** Shadows are soft, dark-navy and negatively spread so they read as glow-less lift on navy; there are no hard offset shadows.

## Shapes

The bubble is the silhouette of the system: 22px corners with one 6px tail corner. Incoming content tails bottom-left; outgoing tails bottom-right; a bubble following another in the same group also tightens its top-left corner to 6px so the group reads as one stack. The same tailed shape is applied to photo attachments, video attachments, films, link cards, product cards and the toast. Controls are full pills (999px): buttons, chips, colour swatches, tags, the composer. Size selectors use a firmer 12px, thumbnails 12 to 15px; small inner tiles (album photos, link thumbs inside mosaics) use a tight 8 to 10px, and bars and marks (editions segments, menu lines) a 2 to 3px hairline radius. The phone mockup in the thread keeps its own device radii (38px frame, 16 to 18px inner) because it draws real hardware, not system UI. Circles are reserved for the avatar, icon buttons (bag, menu, send, play, close) and round video notes, which get a 3px navy gap and a 2px hairline ring (blue while playing).

## Components

### Buttons
- **Shape:** pill (999px), 46px min height, 22px side padding, system 600 at 0.98rem, optional 20px stroked SVG icon.
- **Primary:** pearl fill, navy-800 text; inside a pearl bubble it inverts to navy-700 fill with pearl text.
- **Ghost:** transparent with a line-strong inset ring; ring turns pearl on hover (navy-700 inside bubbles).
- **Sent:** Sent Blue fill, white text; hover lifts to Sent Blue Light. Used for "add to bag".
- **Hover / Focus / Active:** hover only on fine pointers; press scales to 0.97 over 160ms with ease-out; focus is a 2px sent-strong outline offset 3px. Disabled drops to 60% opacity.

### Chips
- **Style:** 40px pill (44px under a coarse pointer), transparent with a hairline ring, pearl text 0.92rem/500.
- **State:** active filter is Sent Blue fill, white text, no ring; `aria-pressed` carries state. Colour swatches are a quieter sibling (34px, 7% pearl fill, 16% when selected, struck through when the colourway is sold out).

### Cards / Containers
- **Message bubble:** pearl (incoming) or Sent Blue (outgoing), 12px 16px padding, max 560px (720px wide variant, 92% on mobile), Bubble lift. A timestamp sits bottom-right in navy-400 at 0.72rem; messages end with "Entregado" receipts.
- **Product card:** navy-700, tailed bubble corners, Bubble lift plus inner hairline, 4:5 media with editions bar (thin 3px segments, one per photo) and a status tag top-left: pearl "Disponible", blue "Últimas unidades", glass "Agotado". Body 18px/20px padding with display name, serif type, display price, swatches, sizes, full-width sent button. Arriving from a link card flashes a 2px sent-strong inner ring for 1.6s.
- **Archive row:** 52px desaturated thumb (grayscale 0.7, brightness 0.8), display name, struck price, blue "Leído" with a double-tick icon.

### Inputs / Fields
- **Composer (email):** a chat "write" bar: navy-800 pill, hairline ring, 20px left padding, borderless 16px input and a 44px blue circular send button. Focus-within turns the ring sent-strong with a 4px blue halo. A successful send appends an outgoing bubble with "Entregado" and an incoming reply. Errors are a small pink line (#ffb4b4) under the bar.
- **Size selector:** 48 by 42px radio labels (44px tall under a coarse pointer), 12px corners, hairline ring; checked is pearl with navy text; sold-out sizes are struck through on a darker well; low stock (1 to 3) shows a 10px blue dot on the corner, explained by an inline legend "quedan pocas".

### Navigation
- **Chat bar:** fixed 64px, transparent over the hero, turning to 82% navy-900 glass (blur 18px, saturate 140%) with a bottom hairline once scrolled. Left: 40px emblem avatar, "nassville" in 700 with "en línea" and a blue presence dot. Right: pill links in ink-soft, current link pearl on a 10% pearl pill; a 44px circular bag with a blue count badge that pops in and bumps on add.
- **Mobile (under 860px):** links collapse into a 44px menu button; the sheet drops from under the bar in navy glass with display-caps links at 2rem divided by hairlines.

### Signature: Typing-to-Bubble Arrival
Each drop and the hero first show a pearl typing indicator (three 8px navy-400 dots bouncing 4px over 1.1s, staggered 0.15s); after about 650ms it disappears and the drop's bubbles, attachments and receipt arrive in order: from opacity 0, translateY(14px) scale(0.98) blur(4px) to rest over 520 to 620ms with ease-out, staggered 70ms per item (capped at 420ms), origin bottom-left. Reduced motion keeps only a 300ms opacity fade.

### Signature: Link Card
A drop's garments appear in the thread as link previews: pearl tailed bubble, 56px thumb (15px corners), host line, ellipsised name, "price · state" in tabular numerals, arrow. Sold-out link cards go translucent (10% pearl, hairline, desaturated thumb) and point to the archive.

### Signature: Attachments and Video Notes
Photo attachments are tailed-bubble mosaics with 3px gutters (2, 3, 4-up and a 4-column dense lead mosaic); "+n" overflow tiles are display caps on a navy veil. Video attachments carry a glass "Vídeo" badge. The videos section uses round video notes in a horizontal snap scroller and 16:9 / 21:9 films with a bottom navy gradient, display title, serif note and a 54px pearl play disc.

### Signature: Back-in-Stock Popover
On a sold-out colourway, "Avísame si vuelve" behaves by context. In the shop grid it scrolls to the footer composer, focuses it and gives the bar a single blue pulse (scale 1.035, 620ms). Inside the product viewer, where the page is covered, the button grows a popover instead: navy-900 glass at 90% (blur 18px), bubble corners, a tail pointing at the button, a 40px Sent Blue bell, display-caps title, meta line "product · colourway", the composer row, the consent checkbox and an inline error line. It opens with a 560ms spring from the button's centre (scale 0.2 to 1.045 to 0.99 to 1, blur 8px to 0), the button dips to 0.94, the contents arrive staggered 45ms and the bell rings once; it closes in 200ms back toward the button. On send the arrow becomes the check, the body turns into a one-line confirmation, and the popover closes itself after 2.4s. Reduced motion keeps only the show and hide.

## Do's and Don'ts

### Do:
- **Do** put new brand content in pearl incoming bubbles with the 22px/6px tail geometry, and new visitor actions in Sent Blue.
- **Do** carry metadata as chat metadata: timestamps, "Entregado", "Leído" with tabular numerals.
- **Do** name the current drop in Instrument Serif italic and older drops in Big Shoulders Display caps.
- **Do** send sold-out product to the archive list (desaturated thumb, struck price, "Leído") rather than leaving it in the live grid.
- **Do** use ease-out (cubic-bezier(0.23, 1, 0.32, 1)) for arrivals and presses, the drawer curve for the toast, and gate hover effects behind fine pointers.
- **Do** keep photos and films as attachments with bubble corners and Attachment lift.
- **Do** grow every tap target to 44px under `(pointer: coarse)`; underlined text links grow an invisible hit area instead of padding, so the underline stays put.
- **Do** serve photos as WebP, the 480px version for thumbnails and mosaics, and play the light `-sm` (540px, muted) or `-bg` (14s loop) cut of a video wherever it autoplays; the original only opens on tap.

### Don't:
- **Don't** introduce a second accent hue; status, focus and action all share Sent Blue.
- **Don't** set body copy or controls in the display face or the serif.
- **Don't** use hard offset shadows or visible borders where an inset hairline ring is the established edge.
- **Don't** invent dates for drops: a drop without a confirmed date shows no stamp.
- **Don't** treat the current row of equal product cards as the shop pattern; it is an open defect (see below).

<!-- Review status (2026-10-07): last finish verdict "fix". Open by user decision: (1) the three equal product cards in a row are not yet reshaped into bubble-shaped link-preview cards; (2) the lead product card's info column floats in empty space because its grid row matches the taller neighbouring card; (3) six of nine drops have no date on the timeline pending real dates. Prices and stock in js/data.js are placeholder data. -->
