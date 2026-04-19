// ═══════════════════════════════════════════
// Reusable Player Scoreboard Row
// ═══════════════════════════════════════════

import { ACCENT_COLORS } from '../state.js';
import { escapeHTML } from '../utils.js';

/**
 * Renders a player row for the dashboard scoreboard.
 * @param {Object} opts
 * @param {string} opts.name
 * @param {number} opts.total
 * @param {number} opts.accentIndex
 * @param {number} opts.rank - 1-based rank
 * @param {Array}  opts.rounds - array of round point values for chips
 * @param {number} opts.progressPct - 0-100 progress toward end condition
 * @param {boolean} opts.isLeader
 * @param {string} opts.winMode - 'highest_total' or 'lowest_total'
 * @returns {string} HTML string
 */
export function renderRow({
  name,
  total,
  accentIndex,
  rank,
  rounds = [],
  progressPct = 0,
  isLeader = false,
  winMode = 'highest_total',
  isInactive = false,
}) {
  const color = ACCENT_COLORS[accentIndex % ACCENT_COLORS.length];
  const bgClass = rank % 2 === 0 ? 'bg-surface-container-lowest' : 'bg-surface-container-high/20';
  const leaderBorder = !isInactive && isLeader ? 'border-l-[3px]' : '';
  const dim = isInactive ? 'opacity-50' : '';

  // Guard against NaN/Infinity leaking into the UI. If we ever see one,
  // render a dash instead so the user isn't staring at 'NaN PTS' — and
  // leave a console trace so we can track down the source.
  let displayTotal = total;
  if (!Number.isFinite(total)) {
    console.warn('Non-finite total rendered in player row:', { name, total });
    displayTotal = '—';
  }

  const rankLabel = rank <= 3
    ? ['1ST', '2ND', '3RD'][rank - 1]
    : `${rank}TH`;

  const roundChips = rounds
    .map(
      (pts, i) =>
        `<span class="inline-block font-mono text-[9px] bg-surface-container-low border border-outline-variant px-1 py-0.5 text-outline">${pts >= 0 ? '+' : ''}${pts}</span>`
    )
    .join('');

  return `
    <div class="accent-${accentIndex} ${bgClass} ${dim} border border-outline group" style="${leaderBorder ? `border-left: 3px solid ${color}` : ''}">
      <div class="accent-bar" style="background:${color}"></div>
      <div class="p-4 flex items-center gap-3">
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2">
            <p class="font-headline font-extrabold text-base uppercase truncate">${escapeHTML(name)}</p>
            <span class="font-mono text-[10px] text-outline uppercase shrink-0">${isInactive ? 'SITTING OUT' : rankLabel}</span>
          </div>
          ${rounds.length > 0 ? `<div class="flex gap-1 mt-1 flex-wrap">${roundChips}</div>` : ''}
        </div>
        <div class="text-right shrink-0">
          <p class="font-mono text-2xl font-bold ${!isInactive && isLeader ? 'text-secondary' : ''}">${displayTotal}</p>
        </div>
      </div>
    </div>
  `;
}
