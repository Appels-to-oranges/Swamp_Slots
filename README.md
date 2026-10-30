# Swamp Slots

Cartoony bayou sweepstakes-style slot machine with dual wallets (Gold Coins + Sweeps Coins). Pure client-side HTML/CSS/JS — no build step.

## Gameplay

- Start with **10,000 Gold Coins** and **5 Sweeps Coins**.
- Toggle which wallet you play with in the top bar.
- Bet `1 / 5 / 10 / 25 / 100` and hit **Spin**.
- Matching combinations pay multipliers into the active wallet.
- **Buy Coins** opens a demo store (no real charges) that grants Gold + bonus Sweeps.
- Watch a rewarded ad for free Sweeps Coins when available.

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

Open `index.html` in a browser, or deploy the folder as a static site. Balances save to `localStorage`.

## Files

| Path | Purpose |
|------|--------|
| `index.html` | Page shell |
| `css/game.css` | Cartoony theme, layout, motions |
| `js/game.js` | Wallets, store stub, spin logic, ads |
| `slot-assets/` | Symbol art |
| `swamp_background.webp` | Full-bleed background |
| `sounds/` | Ambient, spin, win, lose, jackpot audio |
