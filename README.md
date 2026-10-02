# Squish & Spice
A bright, touch-friendly math club made for Delilah and Esther.

## Play
The GitHub Pages address, once deployment is enabled, is:
https://jeffplaysbass.github.io/squish-and-spice/

- **Delilah's Fraction Fiesta:** add, subtract, multiply, and divide simple fractions or mixed numbers. Practice one operation or a balanced mix of all four.
- **Esther's Times Table Pop:** choose one table from 1s through 10s. Every deck includes multipliers 1 through 10 in a shuffled order.
- **Esther's Snack Shop:** count US pennies, nickels, dimes, quarters, and $1, $5, $10 and $20 bills, separately or together.

Every game offers untimed practice, a 60-second dash, or a 2-minute dash. Choose large touch answer buttons or enter your own answers. Fractions accept equivalent and improper fractions. Hints include fraction bars, dot groups, or a money counter; worked solutions let players learn and move on.

Solve an answer to earn a star. Finish a round with at least one solved answer to unlock a squishy buddy. Each player has a separate shelf. Personal bests are separated by activity, difficulty/table, timer, and input style.

## Progress and privacy
No accounts, analytics, ads, external scripts, or external fonts. Stars, completed rounds, times-table records, and personal bests are stored in this browser on this device using localStorage. They do not sync between devices. Clearing browser data removes that device's progress.

The timer pauses when the tab becomes hidden. Use **Pause → Finish & save stars** before closing a round to save earned stars. Hints, retries, and squish breaks are welcome. Sound is optional and starts off. Reduced-motion preferences are respected.

Money is represented by labeled educational tokens, not photographs of currency.

## Hosting
This is a static site with no installation or build step:
- index.html — entry page
- styles.css — responsive styling
- math.js — exact fraction arithmetic, question generation, and round state
- app.js — game interface
- favicon.svg — icon

GitHub Pages can serve the root of the main branch. The optional deployment workflow can also check the logic and publish via GitHub Actions. In repository **Settings → Pages**, choose the matching source.

## Verification
Run:

```sh
node tests/checks.cjs
```

No dependencies are needed. The checks cover arithmetic, unique answer choices, all multiplication facts, money totals, typed answer validation, timers and pauses, deck extension, saved scores, duplicate scoring prevention, and interface event flows using a lightweight DOM stub.

These are logic and interface smoke checks, not a real-browser visual test. The owner is handling play-testing on the family's devices.
