# Game Night Scorer

A real-time multiplayer score tracker for board game and card game nights. One person hosts, everyone else opens the same room on their phone and watches scores update live.

**Live app:** [game-night-scorer.web.app](https://game-night-scorer.web.app)

---

## What it does

- Create a shared room with a 6-character code
- Add players, choose a game, and score rounds live
- Let spectators join by PIN or direct link
- Handle overtime / tie-break scenarios
- Start a new game in the same room without losing the night
- Optionally track night stats and open a **Night Recap** screen with MVP + per-game breakdowns

---

## Supported games

| Game | Players | Win condition | Notes |
|------|---------|---------------|-------|
| **Flip 7** | 2-20 | First/highest to target score (default 200) | +15 bonus for flipping a 7 |
| **Papayoo** | 3-8 | Lowest total after configured rounds | Penalties must sum to 250, Papayoo suit changes each round |
| **Cabo** | 2-4 | Lowest total when someone reaches/busts 100 | Caller gets 0 or +10 penalty, kamikaze supported, exact 100 resets to 50 |

All supported games handle tied first place with overtime logic.

---

## Current app flow

```text
HOME
  ├─ Create session
  └─ Join existing room
        ↓
LOBBY
  ├─ Add / remove / deactivate players
  ├─ Set host player
  ├─ Toggle night stats tracking
  ├─ Open Night Recap (after games have been played)
  └─ Choose game / return to active game
        ↓
GAME SELECT
        ↓
DASHBOARD ↔ RULES ↔ SCORING
        ↓
WINNER
  ├─ Replay same game
  └─ Return to lobby / start another game
```

---

## Highlights from the current branch

The README now reflects the production branch as it exists today, including:

- shared host menu for in-game actions
- route guards so invalid screen access falls back safely
- improved lobby/game lifecycle handling
- optional stats tracking + Night Recap screen
- production-focused main branch without the old test/debug setup

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Frontend | Vanilla JS SPA |
| Styling | Tailwind CSS via CDN |
| Database | Firebase Realtime Database |
| Hosting | Firebase Hosting |
| PWA | Manifest + service worker |

No build step is required for local development or deployment.

---

## Project structure

```text
public/
  index.html
  manifest.json
  sw.js
  css/
    app.css
  js/
    app.js
    firebase.js
    router.js
    state.js
    stats.js
    utils.js
    components/
      bottom-nav.js
      host-menu.js
      player-row.js
      toast.js
    screens/
      home.js
      lobby.js
      game-select.js
      dashboard.js
      rules.js
      scoring.js
      winner.js
      recap.js
    games/
      registry.js
      flip7.js
      papayoo.js
      cabo.js
```

Key Firebase config lives in:

- `/home/runner/work/game-night-scorer/game-night-scorer/public/js/app.js`
- `/home/runner/work/game-night-scorer/game-night-scorer/firebase.json`
- `/home/runner/work/game-night-scorer/game-night-scorer/.firebaserc`

---

## Run locally

Because this is a static app, you can serve the `public/` folder directly.

```bash
npx serve public -l 3000
```

Then open `http://localhost:3000`.

---

## Self-host on Firebase

If you want to host your own copy on Firebase, this repo is already very close to deployable. The main work is pointing it at **your** Firebase project.

### 1. Create a Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Add a **Web App**
4. Enable **Realtime Database**
5. Copy the Firebase web config values

### 2. Replace the Firebase config in the app

Edit:

- `/home/runner/work/game-night-scorer/game-night-scorer/public/js/app.js`

Replace the `FIREBASE_CONFIG` object with your project's config from Firebase Console → **Project settings** → **Your apps**.

Make sure `databaseURL` is included. Firebase sometimes hides it in the default copy snippet, but this app needs it.

### 3. Update the Firebase CLI project mapping

Edit:

- `/home/runner/work/game-night-scorer/game-night-scorer/.firebaserc`

Change the default project ID to your own Firebase project ID.

### 4. Install the Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 5. Select your Firebase project

From the repo root:

```bash
firebase use <your-project-id>
```

If you prefer interactive setup:

```bash
firebase use --add
```

### 6. Verify hosting config

This repo already includes a root `firebase.json` that serves the `public/` folder and rewrites all routes to `index.html`, which is what the SPA needs.

If you keep the same structure, you usually do **not** need to change anything there.

### 7. Deploy

From the repo root:

```bash
firebase deploy --only hosting
```

After deploy, your app should be live on:

```text
https://<your-project-id>.web.app
```

### 8. Realtime Database note

This repository does **not** currently include committed Realtime Database rules or emulator config. For a personal/internal deployment, you can start with a simple Firebase setup in the console. If you want a hardened public deployment, add and manage your own RTDB rules before sharing widely.

---

## Optional: use the included GitHub Actions deploy workflows

This repo already contains Firebase Hosting workflows:

- `/home/runner/work/game-night-scorer/game-night-scorer/.github/workflows/firebase-hosting-pull-request.yml`
- `/home/runner/work/game-night-scorer/game-night-scorer/.github/workflows/firebase-hosting-merge.yml`

If you want those workflows to deploy **your fork/project**, update:

- the Firebase `projectId` in both workflow files
- the default project in `.firebaserc`
- the referenced Firebase service account secret name, or create the secret name expected by the workflow

At minimum, your repository secrets must include a Firebase service account credential that matches the workflow configuration.

---

## Room model

- 6-character room codes with ambiguous characters removed
- Host identity stored in `localStorage` per room
- Viewers can join with a PIN or direct `?room=ABC123` link
- Multiple games can be played in one room
- Night recap is available when stats tracking is enabled before the first game

### Realtime Database shape

```text
rooms/{roomCode}/
  meta/
  players/
  games/
```

---

## Known limitations

- No authentication layer beyond per-room host identity in `localStorage`
- Room cleanup is not automated
- Realtime sync requires an active internet connection
- Firebase RTDB security rules are not documented in-repo yet

---

## License

Private project.
