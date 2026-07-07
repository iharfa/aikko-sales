# Aikko Fest Tracker

Mobile POS + inventory + sales stats for the Aikko print stall, seeded from the
*Creator Super Fest* spreadsheet (71 design/size stock rows, 162 imported sales, $3,565).

## Screens

- **Sell** — tap a design's size button to build a cart. 2+ prints of the same
  size (any designs) auto-price at the bundle rate (A3 $22.50 / A4 $12.50 / A5 $7.50).
  Tap a line's price to override it for custom deals (e.g. 3 A5s for $25).
  Pick Cash/Transfer, charge — the sale is timestamped and stock decrements.
- **Stock** — remaining/sold per design+size, low stock flagged. Tap a start-stock
  number to edit; "+ Add design" for new prints.
- **Sales** — every transaction with time, items, payment, total, grouped by day.
  ✕ voids a sale and restocks the prints. Fest-sheet sales sit in their own section.
- **Stats** — revenue, prints sold, stock progress, revenue by day, by size,
  top designs, cash vs transfer.

## Run

```
npm install
npm run dev
```

With no config it stores data in `data/db.json` (single device / laptop demo).

## Real backend (multi-phone at the stall)

1. Create a free Postgres DB at https://neon.tech
2. Set `DATABASE_URL` (in `.env.local`, or in Vercel project settings)
3. Deploy: `npx vercel`

Tables are created and seeded from the spreadsheet automatically on first request.
On phones: open the URL → share → **Add to Home Screen** (installs as a PWA).

## Prices / currency

Edit [lib/config.ts](lib/config.ts) — single + bundle price per size, currency symbol,
payment methods.
