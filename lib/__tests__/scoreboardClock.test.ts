import { describe, expect, it } from "vitest";

import {
  advancePeriod,
  createInitialScoreboardState,
  formatClockSeconds,
  formatPeriodLabel,
  parseClockInput,
  parseClockMaskParts,
  resetShotClock,
  setGameClockSeconds,
  setQuarterMinutes,
  setShotClockSeconds,
  splitClockSeconds,
  tickScoreboardWithAlerts,
} from "../scoreboardClock";

describe("scoreboardClock", () => {
  it("formats clock and period labels", () => {
    expect(formatClockSeconds(125)).toBe("2:05");
    expect(formatClockSeconds(0)).toBe("0:00");
    expect(formatPeriodLabel(2)).toBe("Q2");
    expect(formatPeriodLabel(5)).toBe("OT");
    expect(formatPeriodLabel(6)).toBe("OT2");
  });

  it("fires shot buzzer when only the shot clock expires", () => {
    const state = {
      ...createInitialScoreboardState(10),
      shotClockSeconds: 1,
      shotRunning: true,
      gameRunning: false,
    };
    const result = tickScoreboardWithAlerts(state);
    expect(result.state.shotClockSeconds).toBe(0);
    expect(result.state.shotRunning).toBe(false);
    expect(result.shotBuzzer).toBe(true);
    expect(result.gameBuzzer).toBe(false);
  });

  it("ticks game and shot clocks independently", () => {
    const state = {
      ...createInitialScoreboardState(10),
      gameClockSeconds: 3,
      shotClockSeconds: 2,
      gameRunning: true,
      shotRunning: true,
    };
    const first = tickScoreboardWithAlerts(state);
    expect(first.state.gameClockSeconds).toBe(2);
    expect(first.state.shotClockSeconds).toBe(1);
    expect(first.gameBuzzer).toBe(false);

    const last = tickScoreboardWithAlerts({
      ...first.state,
      gameClockSeconds: 1,
      shotClockSeconds: 1,
      gameRunning: true,
      shotRunning: true,
    });
    expect(last.state.gameClockSeconds).toBe(0);
    expect(last.state.gameRunning).toBe(false);
    expect(last.gameBuzzer).toBe(true);
    expect(last.shotBuzzer).toBe(true);
  });

  it("updates quarter length and resets clock", () => {
    const state = createInitialScoreboardState(10);
    const updated = setQuarterMinutes(state, 12);
    expect(updated.quarterMinutes).toBe(12);
    expect(updated.gameClockSeconds).toBe(12 * 60);
  });

  it("parses MM:SS mask parts", () => {
    expect(splitClockSeconds(510)).toEqual({ minutes: "08", seconds: "30" });
    expect(parseClockMaskParts("8", "30", 600)).toBe(510);
    expect(parseClockMaskParts("0", "24", 60)).toBe(24);
    expect(parseClockMaskParts("1", "00", 60)).toBe(60);
    expect(parseClockMaskParts("", "70", 60)).toBeNull();
  });

  it("parses clock input and sets timers", () => {
    expect(parseClockInput("8:30", 600)).toBe(510);
    expect(parseClockInput("24", 60)).toBe(24);
    expect(parseClockInput("bad", 60)).toBeNull();

    const state = createInitialScoreboardState(10);
    const game = setGameClockSeconds(state, 90);
    expect(game.gameClockSeconds).toBe(90);
    expect(game.gameRunning).toBe(false);

    const shot = setShotClockSeconds(state, 14);
    expect(shot.shotClockSeconds).toBe(14);
    expect(shot.shotRunning).toBe(false);
  });

  it("advances period and resets shot clock preset", () => {
    let state = advancePeriod(createInitialScoreboardState(8));
    expect(state.period).toBe(2);
    expect(state.gameClockSeconds).toBe(8 * 60);
    state = resetShotClock(state, 14);
    expect(state.shotClockSeconds).toBe(14);
    expect(state.defaultShotClockSeconds).toBe(14);
  });
});
