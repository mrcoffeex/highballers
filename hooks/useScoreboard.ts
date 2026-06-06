import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  playGameBuzzer,
  playShotClockBuzzer,
  preloadScoreboardBuzzer,
  startGameBuzzerHold,
  stopGameBuzzerHold,
} from "../lib/scoreboardBuzzer";
import {
  advancePeriod,
  clampQuarterMinutes,
  createInitialScoreboardState,
  quarterLengthSeconds,
  resetQuarterClock,
  resetShotClock,
  setGameClockSeconds,
  setShotClockSeconds,
  setQuarterMinutes,
  type ScoreboardClockState,
  tickScoreboardWithAlerts,
} from "../lib/scoreboardClock";

function parseStoredState(raw: string | null): ScoreboardClockState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ScoreboardClockState>;
    if (
      typeof parsed.quarterMinutes !== "number" ||
      typeof parsed.period !== "number"
    ) {
      return null;
    }
    const base = createInitialScoreboardState(parsed.quarterMinutes);
    return {
      ...base,
      ...parsed,
      quarterMinutes: clampQuarterMinutes(parsed.quarterMinutes),
      gameRunning: false,
      shotRunning: false,
    };
  } catch {
    return null;
  }
}

export function useScoreboard(storageKey: string) {
  const [state, setState] = useState<ScoreboardClockState>(() =>
    createInitialScoreboardState(),
  );
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = await AsyncStorage.getItem(storageKey);
      if (cancelled) return;
      const stored = parseStoredState(raw);
      if (stored) setState(stored);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(storageKey, JSON.stringify(state)).catch(
      () => undefined,
    );
  }, [hydrated, state, storageKey]);

  useEffect(() => {
    if (hydrated) preloadScoreboardBuzzer();
  }, [hydrated]);

  useEffect(() => {
    if (!state.gameRunning && !state.shotRunning) return;

    const interval = setInterval(() => {
      const current = stateRef.current;
      const {
        state: next,
        gameBuzzer,
        shotBuzzer,
      } = tickScoreboardWithAlerts(current);
      if (gameBuzzer) void playGameBuzzer();
      if (shotBuzzer) void playShotClockBuzzer();
      setState(next);
    }, 1000);

    return () => clearInterval(interval);
  }, [state.gameRunning, state.shotRunning]);

  const patch = useCallback(
    (updater: (current: ScoreboardClockState) => ScoreboardClockState) => {
      setState((current) => updater(current));
    },
    [],
  );

  return {
    state,
    hydrated,
    setTeamAScore: (value: number) =>
      patch((s) => ({ ...s, teamAScore: Math.max(0, value) })),
    adjustTeamAScore: (delta: number) =>
      patch((s) => ({
        ...s,
        teamAScore: Math.max(0, s.teamAScore + delta),
      })),
    setTeamBScore: (value: number) =>
      patch((s) => ({ ...s, teamBScore: Math.max(0, value) })),
    adjustTeamBScore: (delta: number) =>
      patch((s) => ({
        ...s,
        teamBScore: Math.max(0, s.teamBScore + delta),
      })),
    toggleGameClock: () =>
      patch((s) => ({ ...s, gameRunning: !s.gameRunning })),
    toggleShotClock: () =>
      patch((s) => ({ ...s, shotRunning: !s.shotRunning })),
    resetGameClock: () => patch((s) => resetQuarterClock(s)),
    setGameClockSeconds: (seconds: number) =>
      patch((s) => setGameClockSeconds(s, seconds)),
    setShotClockSeconds: (seconds: number) =>
      patch((s) => setShotClockSeconds(s, seconds)),
    resetShotClock: (seconds?: number) =>
      patch((s) => resetShotClock(s, seconds)),
    setQuarterMinutes: (minutes: number) =>
      patch((s) => setQuarterMinutes(s, minutes, true)),
    nextPeriod: () => patch((s) => advancePeriod(s)),
    setPeriod: (period: number) =>
      patch((s) => ({
        ...s,
        period: Math.max(1, Math.round(period)),
        gameRunning: false,
        gameClockSeconds: quarterLengthSeconds(s.quarterMinutes),
      })),
    startBuzzerHold: () => {
      void startGameBuzzerHold();
    },
    stopBuzzerHold: () => {
      void stopGameBuzzerHold();
    },
    triggerBuzzer: () => {
      void playGameBuzzer();
    },
    resetAll: () =>
      patch((s) => createInitialScoreboardState(s.quarterMinutes)),
  };
}
