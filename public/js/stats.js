// ═══════════════════════════════════════════
// Night Recap — Stats Computation
// ═══════════════════════════════════════════

import { getGame } from './games/registry.js';

/**
 * Compute end-of-night stats from all games in a room.
 * @param {Object} games - All games from rooms/{code}/games
 * @param {Object} players - All players from rooms/{code}/players
 * @returns {Object} { overall, perGame }
 */
export function computeNightStats(games, players) {
  const allGames = Object.values(games || {}).filter(
    (g) => g.rounds && Object.keys(g.rounds).length > 0
  );

  if (allGames.length === 0) return null;

  const playerIds = [...new Set(allGames.flatMap((g) => g.playerIds || []))];

  // ── Overall stats per player ──
  // Pre-compute maps to avoid O(N*G) lookups
  const playerNames = new Map();
  const playerAccents = new Map();

  // Populate from players object first
  if (players) {
    for (const [pid, p] of Object.entries(players)) {
      if (p.name !== undefined) playerNames.set(pid, p.name);
      if (p.accentIndex !== undefined) playerAccents.set(pid, p.accentIndex);
    }
  }

  // Populate from game snapshots
  for (const g of allGames) {
    if (g.playerSnapshot) {
      for (const [pid, p] of Object.entries(g.playerSnapshot)) {
        if (p.name !== undefined && !playerNames.has(pid)) playerNames.set(pid, p.name);
        if (p.accentIndex !== undefined && !playerAccents.has(pid)) playerAccents.set(pid, p.accentIndex);
      }
    }
  }

  const overall = {};
  playerIds.forEach((pid) => {
    overall[pid] = {
      playerId: pid,
      name: playerNames.has(pid) ? playerNames.get(pid) : pid,
      accentIndex: playerAccents.has(pid) ? playerAccents.get(pid) : 0,
      gamesPlayed: 0,
      gamesWon: 0,
      bestFinish: Infinity,
      finishes: [],
    };
  });

  // ── Per-game stats ──
  const perGame = allGames.map((game) => {
    const gameModule = getGame(game.type);
    if (!gameModule) return null;

    const snapshot = game.playerSnapshot || {};
    const totals = game.totals || {};
    const rounds = Object.values(game.rounds || {});
    const gPlayerIds = game.playerIds || [];
    const standings = gameModule.deriveStandings(totals, gPlayerIds);

    // Bolt Optimization: Replace O(N) array find with O(1) Map lookup
    const standingsMap = new Map(standings.map(s => [s.playerId, s]));

    // Update overall
    gPlayerIds.forEach((pid) => {
      if (!overall[pid]) return;
      overall[pid].gamesPlayed++;
      const standing = standingsMap.get(pid);
      if (standing) {
        overall[pid].finishes.push(standing.rank);
        if (standing.rank < overall[pid].bestFinish) {
          overall[pid].bestFinish = standing.rank;
        }
      }
      if (game.winner === pid) {
        overall[pid].gamesWon++;
      }
    });

    // Compute game-specific stats
    const gameStats = _computeGameSpecificStats(game, gameModule, rounds, gPlayerIds, snapshot, totals, standings);

    const isAbandoned = game.status === 'abandoned' || (!game.winner && game.status !== 'active' && game.status !== 'overtime');

    return {
      gameId: game.gameId,
      type: game.type,
      label: gameModule.label,
      standings,
      snapshot,
      winner: game.winner,
      roundCount: rounds.length,
      playerStats: gameStats,
      isAbandoned,
    };
  }).filter(Boolean);

  // Determine MVP (most wins, tiebreak: best avg finish)
  const overallList = Object.values(overall);

  // Bolt Optimization: Pre-calculate average finishes to avoid O(N log N) redundant reduce calls in sort comparator
  overallList.forEach(p => {
    p.avgFinish = p.finishes.length ? p.finishes.reduce((s, v) => s + v, 0) / p.finishes.length : 99;
  });

  overallList.sort((a, b) => {
    if (b.gamesWon !== a.gamesWon) return b.gamesWon - a.gamesWon;
    return a.avgFinish - b.avgFinish;
  });

  const mvpId = overallList.length > 0 && overallList[0].gamesWon > 0 ? overallList[0].playerId : null;

  return {
    totalGames: allGames.length,
    totalRounds: allGames.reduce((s, g) => s + Object.keys(g.rounds || {}).length, 0),
    mvpId,
    overall: overallList,
    perGame,
  };
}

function _playerName(pid, allGames, players) {
  // Check players store first
  if (players?.[pid]?.name) return players[pid].name;
  // Fallback to snapshot from any game
  for (const g of allGames) {
    if (g.playerSnapshot?.[pid]?.name) return g.playerSnapshot[pid].name;
  }
  return pid;
}

function _playerAccent(pid, allGames, players) {
  if (players?.[pid]?.accentIndex !== undefined) return players[pid].accentIndex;
  for (const g of allGames) {
    if (g.playerSnapshot?.[pid]?.accentIndex !== undefined) return g.playerSnapshot[pid].accentIndex;
  }
  return 0;
}

function _computeGameSpecificStats(game, gameModule, rounds, playerIds, snapshot, totals, standings) {
  const stats = {};

// Bolt Optimization: Replace O(N) array find with O(1) Map lookup
  const standingsMap = new Map(standings.map(s => [s.playerId, s]));

  // Precompute minCard for cabo rounds to avoid O(P*R) redundant calculations
  const caboMinCards = new Map();
  if (game.type === 'cabo') {
    rounds.forEach((rnd) => {
      if (!rnd.kamikaze) {
        // Bolt Optimization: Replace Object.entries(...).map() with a for...in loop to eliminate intermediate array allocations
        let minCard = Infinity;
        let hasEntries = false;
        const entries = rnd.entries || {};
        for (const id in entries) {
          if (Object.prototype.hasOwnProperty.call(entries, id)) {
            hasEntries = true;
            const ct = entries[id].cardTotal || 0;
            if (ct < minCard) minCard = ct;
          }
        }
        caboMinCards.set(rnd, hasEntries ? minCard : 0);
      }
    });
  }

  playerIds.forEach((pid) => {

    const standing = standingsMap.get(pid);
    const base = {
      playerId: pid,
      name: snapshot[pid]?.name || pid,
      accentIndex: snapshot[pid]?.accentIndex || 0,
      finalRank: standing?.rank || 0,
      totalScore: totals[pid] || 0,
      isWinner: game.winner === pid,
    };

    const roundScores = [];

    if (game.type === 'flip7') {
      let f7Bonuses = 0;
      rounds.forEach((rnd) => {
        const entry = rnd.entries?.[pid];
        if (entry) {
          const pts = (entry.basePoints || 0) + (entry.flip7 ? 15 : 0);
          roundScores.push(pts);
          if (entry.flip7) f7Bonuses++;
        }
      });
      stats[pid] = {
        ...base,
        roundScores,
        bestRound: roundScores.length ? Math.max(...roundScores) : 0,
        worstRound: roundScores.length ? Math.min(...roundScores) : 0,
        f7Bonuses,
      };
    } else if (game.type === 'papayoo') {
      let zeroRounds = 0;
      let heavy40Rounds = 0;
      rounds.forEach((rnd) => {
        const entry = rnd.entries?.[pid];
        if (entry) {
          const pts = entry.penaltyPoints || 0;
          roundScores.push(pts);
          if (pts === 0) zeroRounds++;
          if (pts >= 40) heavy40Rounds++;
        }
      });
      stats[pid] = {
        ...base,
        roundScores,
        bestRound: roundScores.length ? Math.min(...roundScores) : 0,
        worstRound: roundScores.length ? Math.max(...roundScores) : 0,
        zeroRounds,
        heavy40Rounds,
      };
    } else if (game.type === 'cabo') {
      let caboCalls = 0;
      let successfulCabos = 0;
      let kamikazeAttempts = 0;
      let exact100Resets = 0;
      let runningTotal = 0;

      rounds.forEach((rnd) => {
        const entry = rnd.entries?.[pid];
        if (!entry) return;

        const isCaller = rnd.callerId === pid;
        if (isCaller) {
          caboCalls++;
          if (rnd.kamikaze) {
            kamikazeAttempts++;
          }
        }

        // Compute round points for this player
        let roundPts = 0;
        if (rnd.kamikaze) {
          roundPts = isCaller ? 0 : 50;
          if (isCaller) successfulCabos++;
        } else {
          const minCard = caboMinCards.get(rnd);
          if (isCaller) {
            roundPts = (entry.cardTotal || 0) <= minCard ? 0 : (entry.cardTotal || 0) + 10;
            if (roundPts === 0) successfulCabos++;
          } else {
            roundPts = entry.cardTotal || 0;
          }
        }

        roundScores.push(roundPts);
        runningTotal += roundPts;
        if (runningTotal === 100) {
          exact100Resets++;
          runningTotal = 50;
        }
      });

      stats[pid] = {
        ...base,
        roundScores,
        bestRound: roundScores.length ? Math.min(...roundScores) : 0,
        worstRound: roundScores.length ? Math.max(...roundScores) : 0,
        caboCalls,
        successfulCabos,
        kamikazeAttempts,
        exact100Resets,
      };
    }
  });

  return stats;
}
