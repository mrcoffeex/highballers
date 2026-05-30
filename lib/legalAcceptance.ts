import AsyncStorage from "@react-native-async-storage/async-storage";

import { LEGAL_VERSION } from "./legal";

const STORAGE_KEY = "legal-acceptance-version";

export async function getAcceptedLegalVersion(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setAcceptedLegalVersion(
  version: string = LEGAL_VERSION,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, version);
}

export async function hasAcceptedCurrentLegal(): Promise<boolean> {
  const accepted = await getAcceptedLegalVersion();
  return accepted === LEGAL_VERSION;
}
