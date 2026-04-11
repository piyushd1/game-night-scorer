# 🃏 Game Night Scorer

A mobile-first, real-time multiplayer scoreboard for **Flip 7** — the press-your-luck card game by The Op Games. Built as a single HTML file with Firebase Realtime Database for live score sync across all players' phones.

No app install. No account needed for players. Just open a link.

---

## What it does

- **Host creates a game** — sets player count, enters initials, sets win target (default 200)
- **6-character game code** is generated instantly
- **Host shares a link** — friends open it on their phones and see scores update live
- **Only the host** can enter scores and reset the game
- **Spectators** see the leaderboard refresh in real time as rounds are submitted

---

## Features

### Scoring
- Supports 2–20 players
- Configurable win target (default: 200 points per official Flip 7 rules)
- **Flip 7 bonus** — toggle F7 +15 per player when they collect 7 unique cards
- Rounds with 0 score shown distinctly from scored rounds
- Running total auto-summed after every round

### Leaderboard
- Sorted highest → lowest (most points wins)
- 🥇🥈🥉 medals for top 3
- Progress bar per player showing % toward win target (turns gold at 70%+)
- Per-round score chips with round number inline
- Winner banner fires when target is hit

### Entry modal (host only)
- All player rows stable — no jumping or reordering while typing
- Current row highlights green on focus
- Live mini-leaderboard updates in real time as you type each score
- F7 +15 toggle per player — fully editable until you confirm
- Enter to move between fields

### Multiplayer
- Firebase Realtime Database — sub-second sync
- Host identity stored in localStorage (no login required)
- Spectators auto-refresh on every round submission
- Reset propagates to all connected devices instantly

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Vanilla HTML + CSS + JS | Zero build step, single file, works anywhere |
| Hosting | Firebase Hosting | Free, fast CDN, HTTPS out of the box |
| Database | Firebase Realtime Database | WebSocket sync, free tier generous enough |
| Fonts | Google Fonts (Bebas Neue, DM Mono, DM Sans) | Loaded via CDN |
| Firebase SDK | CDN (compat v10) | No npm, no bundler needed |

---

## Setup & Deploy

### Prerequisites
- A [Firebase](https://console.firebase.google.com) account (free)
- Node.js (for Firebase CLI)
- Git

---

### Step 1 — Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `game-night-scorer`
3. Skip Google Analytics
4. Left sidebar → **Build → Realtime Database → Create database**
5. Choose your nearest region
6. Start in **test mode** for now
7. Left sidebar → **Project Settings** (⚙ gear) → **Your apps** → click `</>` (Web)
8. Register the app → copy the `firebaseConfig` object

---

### Step 2 — Add config to index.html

Open `index.html` in any text editor. Near the top, find:

```js
const FIREBASE_CONFIG = {
  apiKey:            "PASTE_YOUR_API_KEY",
  authDomain:        "PASTE_YOUR_AUTH_DOMAIN",
  databaseURL:       "PASTE_YOUR_DATABASE_URL",
  ...
};
```

Replace each value with the real ones from Firebase.

> ⚠️ The `databaseURL` field is required and looks like  
> `https://your-project-default-rtdb.firebaseio.com`  
> Firebase sometimes omits it from the config snippet — find it in  
> **Realtime Database → Data tab → the URL at the top**.

---

### Step 3 — Deploy

```bash
# Install Firebase CLI (one time)
npm install -g firebase-tools

# Login
firebase login

# Clone this repo
git clone https://github.com/piyushd1/game-night-scorer.git
cd game-night-scorer

# Init Firebase hosting (one time)
firebase init hosting
# → Use existing project → game-night-scorer
# → Public directory: .  (just a dot — current folder)
# → Single-page app: No
# → Overwrite index.html: No

# Deploy
firebase deploy
```

You'll get a live URL like:
```
https://game-night-scorer-xxxxx.web.app
```

Bookmark this. Share this with friends. Done.

---

### Step 4 — Lock down database rules (recommended)

In Firebase Console → Realtime Database → Rules, paste:

```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

This is appropriate for a private game among friends. Data is open but not guessable (game codes are random 6-char alphanumeric).

---

## How to play (app flow)

```
Host opens URL
    ↓
Set player count (+ / − buttons)
Enter initials for each player
Set win target
Tap CREATE GAME
    ↓
Game code appears (e.g. XK9P2M)
Tap "Copy Link" → share with friends
    ↓
Friends open the link → spectator view
    ↓
After each round:
  Host taps + ADD ROUND
  Enters score per player
  Toggle F7 +15 if someone flipped 7 cards
  Tap CONFIRM ROUND
    ↓
Leaderboard updates on everyone's screen instantly
    ↓
First to 200+ pts → winner banner fires 🏆
```

---

## Flip 7 scoring rules (reference)

| Situation | Points |
|---|---|
| Sum of number cards collected | Face value |
| Flip 7 bonus (7 unique cards) | +15 |
| Score modifier cards (+2 to +10) | Add to sum |
| x2 modifier | Doubles number card sum only |
| Bust (duplicate card drawn) | 0 for that round |
| Win condition | First to 200+ points |

Full rules: [theop.games/pages/flip-7](https://theop.games/pages/flip-7)

---

## Project structure

```
game-night-scorer/
├── index.html       ← entire app (HTML + CSS + JS, single file)
├── README.md        ← this file
├── PLAN.md          ← product roadmap and decisions log
└── .gitignore
```

---

## Known limitations

- No authentication — host status is localStorage only. If you clear browser data, you lose host access for that game. Create a new game.
- Game codes are not deleted — Firebase entries accumulate. Add a cleanup Cloud Function if this becomes a production tool.
- Offline mode not supported — requires active internet for sync.

---

## License

MIT — do whatever you want with it.
