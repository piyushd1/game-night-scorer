// ═══════════════════════════════════════════
// Winner Screen
// ═══════════════════════════════════════════

import * as state from '../state.js';
import * as router from '../router.js';
import * as bottomNav from '../components/bottom-nav.js';
import { getGame } from '../games/registry.js';
import { ACCENT_COLORS } from '../state.js';
import { escapeHTML } from '../utils.js';

export function mount(container, params = {}) {
  const roomCode = params.roomCode || state.get('roomCode');

  bottomNav.hide();
  document.getElementById('top-bar').style.display = 'none';

  if (!roomCode) {
    router.navigate('home');
    return;
  }

  const game = state.currentGame();
  if (!game || !game.winner) {
    router.navigate('dashboard', { roomCode });
    return;
  }

  const gameModule = getGame(game.type);
  const snapshot = game.playerSnapshot || {};
  const totals = game.totals || {};
  const trackStats = state.get('roomMeta')?.trackStats || false;

  // Derive standings
  const standings = gameModule.deriveStandings(totals, game.playerIds);
  const winner = snapshot[game.winner] || {};
  const winnerTotal = totals[game.winner] || 0;
  const winnerColor = ACCENT_COLORS[winner.accentIndex || 0];

  container.innerHTML = `
    <div class="h-full flex flex-col bg-primary text-on-primary">
      <!-- Back button -->
      <div class="flex items-center px-4 pt-4 shrink-0">
        <button id="btn-back-lobby" aria-label="Back to lobby" class="flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest opacity-70 hover:opacity-100 transition-opacity">
          <span aria-hidden="true" class="material-symbols-outlined text-base">arrow_back</span>
          LOBBY
        </button>
      </div>
      <!-- Hero -->
      <main class="flex-1 flex flex-col items-center justify-center px-6 pt-4 pb-8">
        <div class="text-center w-full max-w-sm mx-auto mb-12">
          <div class="flex items-center justify-center gap-2 mb-4">
            <span aria-hidden="true" class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">emoji_events</span>
            <span class="font-mono text-sm uppercase tracking-widest opacity-80">WINNER</span>
          </div>

          <h1 class="font-headline font-black text-[48px] uppercase tracking-tight leading-none mb-4 truncate">${escapeHTML(winner.name || 'UNKNOWN')}</h1>

          <div class="font-mono text-[72px] font-bold leading-none tracking-tighter">
            ${winnerTotal}
            <span class="text-2xl opacity-70 align-baseline">PTS</span>
          </div>
        </div>

        <!-- Standings -->
        <div class="w-full max-w-sm mx-auto space-y-3">
          ${(() => {
            const cfg = game.config || {};
            const juaOn = !!cfg.jua;
            const buyIn = cfg.juaBuyIn || 0;
            const firstSaveAmt = cfg.juaFirstSave || 5;
            const influenceFine = cfg.juaInfluenceFine || 10;
            const numPlayers = (game.playerIds || []).length;
            const baseShare = (buyIn * numPlayers) / 3;

            const rounds = Object.values(game.rounds || {});
            const savesCounts = {};
            rounds.forEach((rnd) => {
              const pid = rnd.jua?.firstSavePid;
              if (pid) savesCounts[pid] = (savesCounts[pid] || 0) + 1;
            });

            let pool = rounds.filter((r) => r.jua?.firstSavePid).length * firstSaveAmt;
            pool += Object.values(game.juaFines || {}).reduce((s, n) => s + n, 0) * influenceFine;

            const baseReward = (rank) => rank === 1 ? baseShare + 20 : rank === 2 ? baseShare : baseShare - 20;

            const fmt = (n) => `${n >= 0 ? '+' : ''}${n}`;

            return standings.map((s) => {
              const p = snapshot[s.playerId] || {};
              let netLabel = '';
              if (juaOn) {
                const savesCost = (savesCounts[s.playerId] || 0) * firstSaveAmt;
                const finesCost = ((game.juaFines || {})[s.playerId] || 0) * influenceFine;
                let net;
                const terms = [];
                if (s.rank === 1) {
                  net = baseReward(1) + pool - buyIn - savesCost - finesCost;
                  terms.push(fmt(baseReward(1)));
                  if (pool > 0) terms.push(fmt(pool));
                } else if (s.rank <= 3) {
                  net = baseReward(s.rank) - buyIn - savesCost - finesCost;
                  terms.push(fmt(baseReward(s.rank)));
                } else {
                  net = -buyIn - savesCost - finesCost;
                }
                if (savesCost > 0) terms.push(fmt(-savesCost));
                terms.push(fmt(-buyIn));
                if (finesCost > 0) terms.push(fmt(-finesCost));
                const mathStr = terms.length > 1
                  ? `${terms.join(' ')} = ${fmt(net)}`
                  : fmt(net);
                netLabel = `<p class="font-mono text-sm opacity-70">${mathStr}</p>`;
              }
              return `
                <div class="flex justify-between items-center py-2 border-b border-white/20">
                  <div class="flex items-center gap-3">
                    <span class="font-mono text-sm opacity-50 w-6 text-center">${s.rank}</span>
                    <span class="font-headline font-bold text-lg uppercase">${escapeHTML(p.name || s.playerId)}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-mono text-xl font-bold">${s.total}</span>
                    ${netLabel}
                  </div>
                </div>
              `;
            }).join('');
          })()}
        </div>

      </main>

      <!-- Actions -->
      <footer class="p-6 space-y-3 shrink-0">
        <button id="btn-lobby" class="w-full py-4 bg-surface-container-lowest text-primary font-headline font-extrabold uppercase tracking-widest text-base transition-colors hover:bg-surface-container-high">
          BACK TO LOBBY
        </button>
        ${trackStats ? `
        <button id="btn-recap" class="w-full py-4 border border-white/40 text-white font-headline font-extrabold uppercase tracking-widest text-base transition-colors hover:bg-white/10 flex items-center justify-center gap-2">
          <span class="material-symbols-outlined text-lg" aria-hidden="true">bar_chart</span>
          VIEW NIGHT RECAP
        </button>
        ` : ''}
      </footer>
    </div>
  `;

  container.querySelector('#btn-back-lobby')?.addEventListener('click', () => {
    router.navigate('lobby', { roomCode });
  });

  container.querySelector('#btn-lobby')?.addEventListener('click', () => {
    router.navigate('lobby', { roomCode });
  });

  container.querySelector('#btn-recap')?.addEventListener('click', () => {
    router.navigate('recap', { roomCode });
  });
}

export function unmount() {}
