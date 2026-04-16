// ═══════════════════════════════════════════
// Flip 7 Game Module
// ═══════════════════════════════════════════

import { ACCENT_COLORS } from '../state.js';
import { escapeHTML } from '../utils.js';

export default {
  id: 'flip7',
  label: 'Flip 7',
  description: 'Flip cards and push your luck. Highest score wins when someone hits the target.',
  minPlayers: 2,
  maxPlayers: 20,
  winMode: 'highest_total',
  defaultConfig: { targetScore: 200 },
  configFields: [
    { key: 'targetScore', label: 'Win Target', type: 'number', min: 10 },
  ],

  validateRound(draft, gameState) {
    if (!draft.entries) return { valid: false, error: 'No scores entered' };
    for (const pid of Object.keys(draft.entries)) {
      const e = draft.entries[pid];
      if (e.basePoints < 0) return { valid: false, error: `Score for ${pid} cannot be negative` };
    }
    return { valid: true };
  },

  applyRound(currentTotals, roundData, gameState) {
    const newTotals = { ...currentTotals };
    const entries = roundData.entries || {};
    for (const [pid, entry] of Object.entries(entries)) {
      const pts = (entry.basePoints || 0) + (entry.flip7 ? 15 : 0);
      newTotals[pid] = (newTotals[pid] || 0) + pts;
    }
    return newTotals;
  },

  checkEnd(totals, config, playerIds) {
    const target = config?.targetScore || 200;
    const maxScore = Math.max(...playerIds.map((id) => totals[id] || 0));

    if (maxScore < target) return { ended: false, winner: null, overtime: false };

    // Find all players at max
    const leaders = playerIds.filter((id) => (totals[id] || 0) === maxScore);
    if (leaders.length === 1) {
      return { ended: true, winner: leaders[0], overtime: false };
    }
    // Tied — overtime
    return { ended: true, winner: null, overtime: true };
  },

  deriveStandings(totals, playerIds) {
    const sorted = playerIds
      .map((id) => ({ playerId: id, total: totals[id] || 0 }))
      .sort((a, b) => b.total - a.total); // highest first
    let rank = 1;
    sorted.forEach((s, i) => {
      if (i > 0 && s.total < sorted[i - 1].total) rank = i + 1;
      s.rank = rank;
    });
    return sorted;
  },

  getRoundPoints(roundData, playerId) {
    const entry = roundData.entries?.[playerId];
    if (!entry) return 0;
    return (entry.basePoints || 0) + (entry.flip7 ? 15 : 0);
  },

  // ── Scoring Form ──

  renderScorer(playerIds, snapshot, totals, game) {
    return `
      <div class="flex flex-col gap-3">
        ${playerIds.map((pid) => {
          const p = snapshot[pid] || {};
          const color = ACCENT_COLORS[p.accentIndex || 0];
          const currentTotal = totals[pid] || 0;
          return `
            <div class="bg-surface-container-lowest border border-outline">
              <div class="h-[3px]" style="background:${color}"></div>
              <div class="p-4 flex items-center gap-3">
                <div class="flex-1 min-w-0">
                  <p class="font-headline font-extrabold text-sm uppercase truncate">${escapeHTML(p.name || pid)}</p>
                  <p class="font-mono text-[10px] text-outline">${currentTotal} PTS</p>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="number"
                    inputmode="numeric"
                    data-player="${escapeHTML(pid)}"
                    data-field="basePoints"
                    aria-label="Score for ${escapeHTML(p.name || pid)}"
                    class="score-input w-16"
                    placeholder="0"
                    min="0"
                    value=""
                  >
                  <button
                    data-player="${escapeHTML(pid)}"
                    data-field="flip7"
                    aria-pressed="false"
                    aria-label="Flip 7 for ${escapeHTML(p.name || pid)}"
                    class="flip7-toggle px-2 py-1.5 border font-mono text-[10px] uppercase tracking-widest transition-colors border-outline-variant text-outline hover:border-primary"
                  >F7</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Live Preview -->
      <div id="live-preview" class="mt-4 bg-surface-container-high border border-outline p-4">
        <p class="font-mono text-[10px] uppercase tracking-widest text-outline mb-3">PREVIEW</p>
        <div id="preview-rows" class="space-y-1"></div>
      </div>
    `;
  },

  collectDraft(container, playerIds) {
    const entries = {};
    playerIds.forEach((pid) => {
      const input = container.querySelector(`[data-player="${escapeHTML(pid)}"][data-field="basePoints"]`);
      const toggle = container.querySelector(`[data-player="${escapeHTML(pid)}"][data-field="flip7"]`);
      entries[pid] = {
        basePoints: parseInt(input?.value) || 0,
        flip7: toggle?.classList.contains('active') || false,
      };
    });
    return { entries };
  },

  rulesHTML: `
    <section>
      <div class="flex items-start gap-4 mb-4">
        <span class="font-mono text-sm text-outline border border-outline px-2 py-1">01</span>
        <h3 class="text-xl font-bold uppercase tracking-tight font-headline">The Objective</h3>
      </div>
      <div class="bg-surface-container-lowest p-6 border border-outline-variant">
        <p class="text-sm leading-relaxed">Push your luck by flipping cards. Accumulate points each round. First player to reach the target score wins.</p>
        <div class="grid grid-cols-2 gap-3 mt-4">
          <div class="p-3 bg-surface-container-low border border-outline-variant">
            <p class="font-mono text-[10px] uppercase text-outline mb-1">Default Target</p>
            <p class="font-mono text-lg font-bold">200 PTS</p>
          </div>
          <div class="p-3 bg-surface-container-low border border-outline-variant">
            <p class="font-mono text-[10px] uppercase text-outline mb-1">Players</p>
            <p class="font-mono text-lg font-bold">2-20</p>
          </div>
        </div>
      </div>
    </section>

    <section>
      <div class="flex items-start gap-4 mb-4">
        <span class="font-mono text-sm text-outline border border-outline px-2 py-1">02</span>
        <h3 class="text-xl font-bold uppercase tracking-tight font-headline">Scoring</h3>
      </div>
      <div class="pl-6 border-l border-outline-variant space-y-3">
        <p class="text-sm text-on-surface-variant leading-relaxed">Each round, players earn points based on the cards they flipped.</p>
        <div class="bg-surface-container-lowest p-4 border border-outline-variant">
          <p class="font-headline font-bold text-sm uppercase mb-2">Flip 7 Bonus</p>
          <p class="text-sm text-on-surface-variant">If a player flips exactly a 7, they receive a <span class="font-bold">+15 point bonus</span> on top of their base score for that round.</p>
        </div>
      </div>
    </section>

    <section>
      <div class="flex items-start gap-4 mb-4">
        <span class="font-mono text-sm text-outline border border-outline px-2 py-1">03</span>
        <h3 class="text-xl font-bold uppercase tracking-tight font-headline">Winning</h3>
      </div>
      <div class="pl-6 border-l border-outline-variant space-y-3">
        <p class="text-sm text-on-surface-variant leading-relaxed">The game ends when any player's cumulative total reaches or exceeds the target score. The player with the <span class="font-bold">highest total</span> wins.</p>
        <p class="text-sm text-on-surface-variant leading-relaxed">If first place is tied, the game enters <span class="font-bold uppercase">overtime</span> and continues until a unique winner exists.</p>
      </div>
    </section>
  `,
};
