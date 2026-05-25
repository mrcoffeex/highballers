import { BalancedTeams, PlayerStats, UserProfile } from './types';

const STAT_WEIGHTS = {
  speed: 1.2,
  strength: 1.0,
  shooting: 1.3,
  defense: 1.1,
  stamina: 0.9,
};

export function calculatePlayerRating(stats: PlayerStats): number {
  const skillScore =
    stats.speed * STAT_WEIGHTS.speed +
    stats.strength * STAT_WEIGHTS.strength +
    stats.shooting * STAT_WEIGHTS.shooting +
    stats.defense * STAT_WEIGHTS.defense +
    stats.stamina * STAT_WEIGHTS.stamina;

  const heightBonus = Math.min(Math.max((stats.height - 170) / 20, 0), 2);
  const weightFactor = Math.min(Math.max((stats.weight - 60) / 40, 0), 1) * 0.5;

  return Math.round((skillScore + heightBonus + weightFactor) * 10) / 10;
}

export function balanceTeams(players: UserProfile[]): BalancedTeams {
  if (players.length < 2) {
    return {
      teamA: players.slice(0, 1),
      teamB: players.slice(1),
      ratingA: players[0] ? calculatePlayerRating(players[0].stats) : 0,
      ratingB: 0,
    };
  }

  const ranked = [...players].sort(
    (a, b) => calculatePlayerRating(b.stats) - calculatePlayerRating(a.stats),
  );

  const teamA: UserProfile[] = [];
  const teamB: UserProfile[] = [];

  ranked.forEach((player, index) => {
    const round = Math.floor(index / 2);
    const isEvenRound = round % 2 === 0;
    const pickTeamA = index % 2 === 0 ? isEvenRound : !isEvenRound;

    if (pickTeamA) {
      teamA.push(player);
    } else {
      teamB.push(player);
    }
  });

  const ratingA = teamA.reduce((sum, p) => sum + calculatePlayerRating(p.stats), 0);
  const ratingB = teamB.reduce((sum, p) => sum + calculatePlayerRating(p.stats), 0);

  return { teamA, teamB, ratingA, ratingB };
}

export function getRatingDifference(teams: BalancedTeams): number {
  return Math.abs(teams.ratingA - teams.ratingB);
}

export function getBalanceLabel(teams: BalancedTeams): string {
  const diff = getRatingDifference(teams);
  const avg = (teams.ratingA + teams.ratingB) / 2 || 1;
  const percent = (diff / avg) * 100;

  if (percent <= 5) return 'Perfectly balanced';
  if (percent <= 12) return 'Well balanced';
  if (percent <= 20) return 'Fair match';
  return 'Slight mismatch';
}
