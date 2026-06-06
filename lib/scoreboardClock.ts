export const DEFAULT_QUARTER_MINUTES = 10;
export const MIN_QUARTER_MINUTES = 4;
export const MAX_QUARTER_MINUTES = 20;
export const DEFAULT_SHOT_CLOCK_SECONDS = 24;
export const MAX_SHOT_CLOCK_SECONDS = 60;
export const SHOT_CLOCK_PRESETS = [24, 30, 14] as const;

export interface ScoreboardClockState {
  quarterMinutes: number;
  period: number;
  teamAScore: number;
  teamBScore: number;
  gameClockSeconds: number;
  shotClockSeconds: number;
  gameRunning: boolean;
  shotRunning: boolean;
  defaultShotClockSeconds: number;
}

export function clampQuarterMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return DEFAULT_QUARTER_MINUTES;
  return Math.min(
    MAX_QUARTER_MINUTES,
    Math.max(MIN_QUARTER_MINUTES, Math.round(minutes)),
  );
}

export function quarterLengthSeconds(minutes: number): number {
  return clampQuarterMinutes(minutes) * 60;
}

export function formatClockSeconds(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export type ClockMaskParts = {
  minutes: string;
  seconds: string;
};

export function splitClockSeconds(totalSeconds: number): ClockMaskParts {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return {
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
}

/** Build seconds from fixed `MM` + `SS` digit fields (invalid → null). */
export function parseClockMaskParts(
  minutes: string,
  seconds: string,
  maxSeconds: number,
): number | null {
  const minDigits = minutes.replace(/\D/g, "");
  const secDigits = seconds.replace(/\D/g, "");
  if (secDigits.length === 0) return null;

  const mins = minDigits.length > 0 ? Number.parseInt(minDigits, 10) : 0;
  const secs = Number.parseInt(secDigits.padStart(2, "0").slice(-2), 10);
  if (Number.isNaN(mins) || Number.isNaN(secs) || secs > 59) return null;

  const total = mins * 60 + secs;
  return Math.min(maxSeconds, Math.max(0, total));
}

/** Parse `M:SS`, `MM:SS`, or raw seconds (e.g. `24`). */
export function parseClockInput(
  text: string,
  maxSeconds: number,
): number | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.includes(":")) {
    const [minutePart, secondPart = "0"] = trimmed.split(":");
    const minutes = Number.parseInt(minutePart, 10);
    const seconds = Number.parseInt(secondPart, 10);
    if (Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
    const total = minutes * 60 + seconds;
    return Math.min(maxSeconds, Math.max(0, total));
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) return null;
  return Math.min(maxSeconds, Math.max(0, parsed));
}

export function formatPeriodLabel(period: number): string {
  if (period <= 4) return `Q${period}`;
  if (period === 5) return "OT";
  return `OT${period - 4}`;
}

export function createInitialScoreboardState(
  quarterMinutes = DEFAULT_QUARTER_MINUTES,
): ScoreboardClockState {
  const minutes = clampQuarterMinutes(quarterMinutes);
  return {
    quarterMinutes: minutes,
    period: 1,
    teamAScore: 0,
    teamBScore: 0,
    gameClockSeconds: quarterLengthSeconds(minutes),
    shotClockSeconds: DEFAULT_SHOT_CLOCK_SECONDS,
    gameRunning: false,
    shotRunning: false,
    defaultShotClockSeconds: DEFAULT_SHOT_CLOCK_SECONDS,
  };
}

export function tickScoreboardClock(
  state: ScoreboardClockState,
): ScoreboardClockState {
  let next = state;
  let gameExpired = false;
  let shotExpired = false;

  if (state.gameRunning && state.gameClockSeconds > 0) {
    const gameClockSeconds = state.gameClockSeconds - 1;
    gameExpired = gameClockSeconds === 0;
    next = {
      ...next,
      gameClockSeconds,
      gameRunning: gameExpired ? false : next.gameRunning,
    };
  }

  if (state.shotRunning && state.shotClockSeconds > 0) {
    const shotClockSeconds = state.shotClockSeconds - 1;
    shotExpired = shotClockSeconds === 0;
    next = {
      ...next,
      shotClockSeconds,
      shotRunning: shotExpired ? false : next.shotRunning,
    };
  }

  return next;
}

export function setQuarterMinutes(
  state: ScoreboardClockState,
  minutes: number,
  resetClock = true,
): ScoreboardClockState {
  const quarterMinutes = clampQuarterMinutes(minutes);
  return {
    ...state,
    quarterMinutes,
    gameRunning: false,
    gameClockSeconds: resetClock
      ? quarterLengthSeconds(quarterMinutes)
      : Math.min(state.gameClockSeconds, quarterLengthSeconds(quarterMinutes)),
  };
}

export function resetQuarterClock(
  state: ScoreboardClockState,
): ScoreboardClockState {
  return {
    ...state,
    gameRunning: false,
    gameClockSeconds: quarterLengthSeconds(state.quarterMinutes),
  };
}

export function advancePeriod(
  state: ScoreboardClockState,
): ScoreboardClockState {
  return {
    ...state,
    period: state.period + 1,
    gameRunning: false,
    gameClockSeconds: quarterLengthSeconds(state.quarterMinutes),
  };
}

export function setGameClockSeconds(
  state: ScoreboardClockState,
  seconds: number,
): ScoreboardClockState {
  const maxSeconds = quarterLengthSeconds(state.quarterMinutes);
  return {
    ...state,
    gameRunning: false,
    gameClockSeconds: Math.min(maxSeconds, Math.max(0, Math.floor(seconds))),
  };
}

export function setShotClockSeconds(
  state: ScoreboardClockState,
  seconds: number,
): ScoreboardClockState {
  return {
    ...state,
    shotRunning: false,
    shotClockSeconds: Math.min(
      MAX_SHOT_CLOCK_SECONDS,
      Math.max(0, Math.floor(seconds)),
    ),
  };
}

export function resetShotClock(
  state: ScoreboardClockState,
  seconds?: number,
): ScoreboardClockState {
  const shotClockSeconds = seconds ?? state.defaultShotClockSeconds;
  return {
    ...state,
    shotRunning: false,
    shotClockSeconds,
    defaultShotClockSeconds: seconds ?? state.defaultShotClockSeconds,
  };
}

export type ScoreboardTickResult = {
  state: ScoreboardClockState;
  gameBuzzer: boolean;
  shotBuzzer: boolean;
};

export function tickScoreboardWithAlerts(
  state: ScoreboardClockState,
): ScoreboardTickResult {
  const beforeGame = state.gameClockSeconds;
  const beforeShot = state.shotClockSeconds;
  const next = tickScoreboardClock(state);

  return {
    state: next,
    gameBuzzer:
      state.gameRunning && beforeGame > 0 && next.gameClockSeconds === 0,
    shotBuzzer:
      state.shotRunning && beforeShot > 0 && next.shotClockSeconds === 0,
  };
}
