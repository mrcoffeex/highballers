import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

const buzzerSource = require("../assets/sounds/basketball-buzzer.wav");

const SHOT_CLOCK_BUZZER_DEADLINE_MS = 2000;
const SHOT_BUZZER_DEBOUNCE_MS = 300;

let player: AudioPlayer | null = null;
let audioReady = false;
let holdActive = false;
let lastShotBuzzerAttemptAt = 0;

async function ensureBuzzerPlayer(): Promise<AudioPlayer | null> {
  if (player) return player;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    });
    player = createAudioPlayer(buzzerSource, {
      downloadFirst: Platform.OS !== "web",
    });
    audioReady = true;
    return player;
  } catch {
    audioReady = false;
    return null;
  }
}

async function playFallbackBuzzer() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(
    () => undefined,
  );
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
    () => undefined,
  );
}

/** Hold the scoreboard buzzer button — loops until stopGameBuzzerHold(). */
export async function startGameBuzzerHold() {
  const buzzer = await ensureBuzzerPlayer();
  if (!buzzer) {
    await playFallbackBuzzer();
    return;
  }

  holdActive = true;
  try {
    buzzer.loop = true;
    buzzer.seekTo(0);
    buzzer.play();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
      () => undefined,
    );
  } catch {
    holdActive = false;
    await playFallbackBuzzer();
  }
}

/** Release the scoreboard buzzer button. */
export async function stopGameBuzzerHold() {
  holdActive = false;
  const buzzer = player;
  if (!buzzer) return;

  try {
    buzzer.pause();
    buzzer.seekTo(0);
    buzzer.loop = false;
  } catch {
    // ignore pause errors
  }
}

async function playBuzzerBlast(): Promise<boolean> {
  if (holdActive) return true;

  const buzzer = await ensureBuzzerPlayer();
  if (!buzzer) return false;

  try {
    buzzer.loop = false;
    buzzer.seekTo(0);
    buzzer.play();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(
      () => undefined,
    );
    return true;
  } catch {
    return false;
  }
}

/** Warm up audio so the first shot-clock buzzer is not delayed. */
export function preloadScoreboardBuzzer(): void {
  void ensureBuzzerPlayer();
}

/** Single buzzer blast when a clock hits zero. */
export async function playGameBuzzer() {
  const played = await playBuzzerBlast();
  if (!played) {
    await playFallbackBuzzer();
  }
}

/** Shot clock expiry — retries until the buzzer plays or the deadline is reached. */
export async function playShotClockBuzzer() {
  const now = Date.now();
  if (now - lastShotBuzzerAttemptAt < SHOT_BUZZER_DEBOUNCE_MS) return;
  lastShotBuzzerAttemptAt = now;

  const deadline = now + SHOT_CLOCK_BUZZER_DEADLINE_MS;
  let played = await playBuzzerBlast();

  while (!played && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    played = await playBuzzerBlast();
  }

  if (!played) {
    await playFallbackBuzzer();
  }
}

export function isBuzzerAudioReady() {
  return audioReady;
}
