# Squish & Spice
A bright, touch-friendly math club made for Delilah and Esther.

## Play
The GitHub Pages address, once deployment is enabled, is:
https://jeffplaysbass.github.io/squish-and-spice/

- **Delilah's Fraction Fiesta:** add, subtract, multiply, and divide simple fractions or mixed numbers. Practice one operation or a balanced mix of all four. Each round includes regular equations and missing-number puzzles such as 1/2 + ? = 3/4.
- **Esther's Times Table Pop:** choose one table from 1s through 10s. Every deck includes multipliers 1 through 10 in a shuffled order.
- **Esther's Snack Shop:** count US pennies, nickels, dimes, quarters, and $1, $5, $10 and $20 bills, separately or together. Answer with the total dollar-and-cent value of the whole pile. Tapping a piece only marks it as counted. Choose the original **Learning tokens** or **Money drawings**: original, playful illustrations inspired by familiar American coins and bills.

Every game is a single round of ten distinct questions, with untimed practice, a 60-second limit, or a 2-minute limit. Timed games move straight to the next question after a correct answer and end after question ten or when time runs out. Worked steps remain available when the player explicitly chooses "Show me how". Choose large touch answer buttons or enter your own answers. Fractions accept equivalent and improper fractions. Hints include fraction bars, dot groups, or a money counter; worked solutions let players learn and move on.

Solve an answer to earn a star. Earn one squishy only by getting 10/10 on the first attempt in a single complete round. Hints are allowed; retries, revealed answers, incomplete rounds, and scores accumulated across rounds do not qualify for the squishy reward. This rule applies to both untimed and timed rounds. Stars still reward learning and retries. Each player has a separate shelf, and existing v1 squishies are preserved. Personal bests are separated by activity, difficulty/table, timer, and input style. The new ten-question timed format has its own best-score records.

## Progress and privacy
No accounts, analytics, ads, external scripts, or external fonts. Stars, completed rounds, times-table records, and personal bests are stored in this browser on this device using localStorage. They do not sync between devices. Clearing browser data removes that device's progress.

Each fraction round contains six missing-result equations and four missing-operand equations. Question selection is without replacement, so simplifying fractions or reversing addition/multiplication operands cannot create duplicate problems. Consecutive "Another round" games avoid the preceding round where the question bank allows.

The timer pauses when the tab becomes hidden. Use **Pause → Finish & save stars** before closing a round to save earned stars. Hints, retries, and squish breaks are welcome. Sound is optional and starts off. Reduced-motion preferences are respected.

Snack Shop has two money appearances, with a side-by-side preview in setup and a quick switch during a round. Learning tokens keep the original large value labels. Money drawings use copper and silver coin colors, distinct portraits, and decorative bill layouts in the game's illustrated style. Both are drawn artwork; no photographs are used. The same choice also applies to the money guide and is remembered on this device. Switching the look preserves the current question, counted pieces, typed answer, and timer.

## Hosting
This is a static site with no installation or build step:
- index.html — entry page
- styles.css — responsive styling
- math.js — exact fraction arithmetic, question generation, and round state
- app.js — game interface
- favicon.svg — icon
- assets/money/ — eight original SVG coin and bill illustrations

GitHub Pages can serve the root of the main branch. The optional deployment workflow can also check the logic and publish via GitHub Actions. In repository **Settings → Pages**, choose the matching source.

## Verification
Run:

```sh
node tests/checks.cjs
```

No dependencies are needed. The checks cover arithmetic, inverse operations, distinct questions (including equivalent fractions and swapped operands), unique answer choices, all multiplication facts, money totals, typed answer validation, timers and pauses, automatic progression, ten-question completion, perfect-round reward eligibility, legacy progress migration, duplicate scoring prevention, money appearance selection and persistence, switching appearance mid-round without losing state, packaged artwork, and interface event flows using a lightweight DOM stub.

These are logic and interface smoke checks, not a real-browser visual test. The owner is handling play-testing on the family's devices.
