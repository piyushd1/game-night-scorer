# Game Night Scorer

A real-time, multiplayer score tracker for board game and card game nights. One person hosts, everyone else watches the live scoreboard on their phones.

**Live:** [game-night-scorer.web.app](https://game-night-scorer.web.app)

---

## How It Works

```
Host creates room  -->  Friends join via 6-digit PIN or link
       |
  Add players  -->  Pick a game  -->  Score rounds live
       |                                      |
  Everyone sees           Winner declared when
  live scoreboard         end condition is met
```

**Host** controls everything: adds players, picks the game, enters scores each round, can undo mistakes.

**Viewers** open the room link on their phone and watch scores update in real time. No account needed, no app to install.

---

## Supported Games

| Game | Players | Win Condition | Special Rules |
|------|---------|---------------|---------------|
| **Flip 7** | 2-20 | Highest score hits target (default 200) | +15 bonus for flipping a 7 |
| **Papayoo** | 3-8 | Lowest score after N rounds (default 5) | Penalties must sum to 250. Papayoo suit changes each round. |
| **Cabo** | 2-4 | Lowest score when someone busts 100 | Caller gets 0 or +10 penalty. Kamikaze = 0/50 split. Exact 100 resets to 50. |

All three games support **overtime/tie-breaker** when the end condition is met but first place is tied.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Vanilla JS SPA | Zero build step, fast, no dependencies |
| Styling | Tailwind CSS (CDN) | Utility-first, matches design system |
| Database | Firebase Realtime Database | WebSocket sync, sub-second updates |
| Hosting | Firebase Hosting | Free, fast CDN, HTTPS |
| Fonts | Google Fonts (Manrope, Space Mono) | Loaded via CDN |
| PWA | Service Worker + Manifest | Installable on phones |

### Design System: The Analog Architect

A brutalist, editorial aesthetic inspired by Swiss typography and mid-century blueprinting.

- **Fonts:** Manrope (headings/body) + Space Mono (data/scores)
- **Palette:** Off-white paper (#F4F4F2), black ink (#000000), precise accents
- **Rules:** No shadows, no gradients, 0px border radius, 1px borders
- **Player colors:** 10 distinct accent colors for up to 10+ players

---

## Project Structure

```
public/
  index.html              # SPA shell
  manifest.json           # PWA manifest
  sw.js                   # Service worker
  css/app.css             # All styles + design tokens
  js/
    app.js                # Entry point + Firebase config
    router.js             # Hash-based SPA router with transitions
    state.js              # Reactive state store
    firebase.js           # RTDB helpers (rooms, players, games, rounds)
    screens/
      home.js             # Create / Join room
      lobby.js            # Player roster management
      game-select.js      # Pick game + configure
      dashboard.js        # Live scoreboard
      scoring.js          # Score entry (host only)
      rules.js            # Game rules display
      winner.js           # Winner celebration + replay
    games/
      registry.js         # Game module registry
      flip7.js            # Flip 7 logic + rules + scorer
      papayoo.js          # Papayoo logic + rules + scorer
      cabo.js             # Cabo logic + rules + scorer
    components/
      bottom-nav.js       # Tab bar (Dashboard / Rules / Scoring)
      player-row.js       # Scoreboard row component
      toast.js            # Toast notifications
```

---

## Setup

### Prerequisites

- A [Firebase](https://console.firebase.google.com) project with **Realtime Database** enabled (test mode)
- Node.js + Firebase CLI (`npm install -g firebase-tools`)

### Configure

1. Clone the repo
2. Edit `public/js/app.js` — replace the `FIREBASE_CONFIG` object with your Firebase project credentials
   - Found in: Firebase Console > Project Settings > Your Apps > Web
   - Make sure `databaseURL` is included (Firebase sometimes omits it)
3. Run `firebase login` and `firebase use <your-project-id>`

### Run Locally

```bash
npx serve public -l 3000
```

### Deploy

```bash
firebase deploy --only hosting
```

---

## Room System

- **6-character codes** — no confusing characters (I/O/0/1 excluded)
- **Host identity** stored in `localStorage` per room
- **Viewers** join anonymously via PIN or direct link (`?room=ABC123`)
- **Multiple games** can be played in the same room without losing data

### Firebase RTDB Structure

```
rooms/{roomCode}/
  meta/         # roomCode, hostKey, status, activeGameId, timestamps
  players/      # id, name, isActive, seatOrder, accentIndex
  games/        # type, config, playerSnapshot, rounds, totals, status, winner
```

---

## App Flow

```
HOME ──> Create Session ──> LOBBY (add players)
  |                            |
  |                      Choose Game
  |                            |
  +--> Join via PIN ──> DASHBOARD <──> RULES
                           |
                        SCORING (host)
                           |
                        WINNER ──> Replay / New Game
```

---

## Roadmap

### Phase 1 (Current)

- [x] Room creation and joining via PIN / link
- [x] Player roster management with accent colors
- [x] Flip 7, Papayoo, Cabo full scoring logic
- [x] Live real-time scoreboard synced across devices
- [x] Host controls (submit, undo, replay, new game)
- [x] Winner detection with overtime/tie-breaker
- [x] PWA installable
- [x] Analog Architect design system
- [ ] Comprehensive rules content for all games

### Phase 2 (Planned)

- [ ] Game history and past results
- [ ] Rules search across all games
- [ ] Player stats and lifetime records
- [ ] Additional games
- [ ] Dark mode

---

## Known Limitations

- **No auth** — host status is `localStorage` only. Clearing browser data loses host access.
- **No cleanup** — room data persists in Firebase. Add a Cloud Function for TTL-based cleanup if needed.
- **Online only** — requires active internet for real-time sync.

---

## License

Private project.
