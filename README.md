# Swamp Slots

Browser-based slot machine with a bayou theme, pixel-art symbols, and sound effects. Pure client-side HTML, CSS, and JavaScript — no build step required.

## Gameplay

- Start with $100 in chips.
- Choose a bet denomination ($5 / $10 / $20 / $100) and hit **Spin**.
- Three reels land on swamp-themed symbols; matching combinations pay out according to the payout table.
- Watch a rewarded ad to rebuy $100 in chips when you run out (AdSense Ad Placement API).

## Payout Table

| Combination | Multiplier |
|-------------|------------|
| 3 Catfish | 50x (Jackpot) |
| 3 Crayfish | 10x |
| 3 Alligator | 8x |
| 3 Worm | 4x |
| 3 Hook | 3x |
| 2 Worms | 1x (bet back) |

## Run

Open `index.html` in a browser. Chip balance is saved to `localStorage`.

## Files

| Path | Purpose |
|------|--------|
| `index.html` | Full game (markup, styles, and logic in one file) |
| `slot-assets/` | Pixel-art symbol images |
| `sounds/` | Ambient, spin, win, lose, and jackpot audio |
