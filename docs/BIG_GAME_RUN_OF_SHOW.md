# The Wilderness: Big Game — Run of Show

One page for the game director. Everything else is detail.

**Shape of the game:** 12 tribes, 12 stations, 6 rounds of ~12 minutes (10 min
challenge + 2 min movement). In every round each tribe is at exactly one
station and each station has exactly one tribe. Tribes rotate forward one
station per round.

**The one rule that makes it work:** *you* advance the round, for everybody, at
once. A tribe that solves its station early does **not** move — its screen says
"wait here for the signal." If tribes moved themselves, a fast tribe would walk
into a station another tribe is still standing in.

---

## Before the event

| # | Do this | Where |
|---|---|---|
| 1 | Run the database migration | `supabase db push` (see below) |
| 2 | Verify the route engine | `npm run verify:big-game` — must print `Route engine verified.` |
| 3 | Name the tribes (or leave them T1–T12) and confirm the Team A–D mapping | Big Game → **Setup** → Tribes |
| 4 | **Set all 12 station locations.** This is the one thing that blocks the start | Setup → Stations |
| 5 | Generate the 72 station codes (enter any seed word, e.g. `wilderness2026`) | Setup → Station codes |
| 6 | Generate the 12 tribe join codes | Setup → Tribes → Regenerate join codes |
| 7 | Confirm the readiness checklist is all green | Setup → Readiness |
| 8 | **Print the moderator cards — 12 pages, one per station** | Setup → Print → Moderator cards |
| 9 | **Print the tribe slips — 12 join codes to cut apart** | Setup → Print → Tribe slips |
| 10 | Run the self test | Director → Self test |

**What to print (this is the whole paper trail):**

- **12 moderator cards.** One per station. Each has that station's 6 codes,
  labelled `ROUND 1`–`ROUND 6`, and the tribe expected in each round. Hand one
  to each station moderator. They never log in and never touch the site.
- **12 tribe slips.** One join code each, for the tribe leaders.

Tell every moderator, out loud, twice: **give the code only after the challenge
is genuinely complete, and give only the code for the round we are currently
in.** The codes change every round on purpose — a code shouted forward to the
next tribe is worthless one round later.

Tribe leaders open **`<your-site>/wilderness`** and enter their join code. They
do not need a camp account and do not need to log in.

---

## Starting

1. Moderators in position, cards in hand.
2. Tribes assembled with their leaders, join codes entered, screens showing
   *"The journey has not begun."*
3. Director → **Start game**. Every screen flips to Round 1 and its destination.
4. Blow the horn.

If Start is greyed out, the checklist tells you exactly what is missing —
almost always a station without a location.

---

## During each round

Watch the header: **`Round 3 / 6` · elapsed time · `9 / 12 done`.**

- The `done` count is your cue. At 12/12, or when the 10 minutes are up,
  whichever comes first — advance.
- Blow the horn for the 2-minute movement window, then press **Advance round**.
- The app shows you what will happen first: *"2 tribes have not finished — they
  will be marked missed: T4, T9."* Confirm.
- Those tribes are marked **missed**, move with everyone else, and simply end
  with one fewer station. Never hold the rotation for a stuck tribe.

The elapsed timer is **advisory only**. It will not advance anything, and it
will not stop anyone submitting. You are the clock.

After round 6, Advance ends the game. Every leader screen shows *"Journey
complete."*

---

## When something goes wrong

| Situation | What to do |
|---|---|
| **A leader's phone dies** | The co-leader opens `/wilderness` on their phone and enters the *same* join code. Progress is intact. Both phones can be signed in at once. |
| **A tribe swears they finished but the code won't take** | Check they are reading the card for the *current* round. If it's a genuine dispute or a broken phone, Director → that tribe's row → **Manual complete**. It records as `OVERRIDDEN` with your name on it. |
| **A station's challenge breaks mid-round** | Director → that tribe's row → **Skip**. Records `SKIPPED`; does not count toward their completed stations. |
| **Rain / injury / anything needing a stop** | **Pause**. All submissions are rejected, every screen says *"Stay where you are."* **Resume** when ready. |
| **A camper is mistyping over and over** | Nothing to do. There is no lockout and no attempt limit. After ~10 tries in a minute they get a gentle "slow down" and can keep going. |
| **Wi-Fi drops** | Their screen keeps showing the destination and queues the submission with an honest *"will submit when you're back online."* It validates on the server when the signal returns. Nothing is lost. |
| **You need the answer key** | Director → **Code sheet** → Reveal. It starts hidden on purpose. Hide it again before a camper walks past. |

---

## Resetting

- **One tribe** — Director → that row → Reset tribe. Clears their results only.
- **Everything** — Director → **Reset all progress**. Type `RESET`, confirm
  twice, and tick *force* if the game is live. Returns to a clean pre-event
  SETUP state with tribes, stations and codes intact. Audit-logged.

Do a full dry run with 2–3 tribes first, then reset all. That is what the reset
is for.

---

## Setup commands

```bash
supabase db push
npm run verify:big-game
```

If you apply migrations by hand, run
`supabase/migrations/20260818000000_big_game_wilderness.sql` against the project
database. It is idempotent and self-verifying: it fails rather than installing a
broken route engine.

---

## Removing the game after the event

Delete `src/lib/bigGame/`, `src/components/big-game/`,
`src/hooks/useBigGameLeader.ts`, `src/hooks/useBigGameAdmin.ts`,
`scripts/verify-big-game.ts`, `tsconfig.verify.json`, this file, the
`verify:big-game` npm script, and the `isWildernessPage` block plus the two
lazy imports in `src/App.tsx`. Drop the `bg_*` tables and functions. Nothing
else on the site touches it.
