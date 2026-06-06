import * as ExpoCrypto from "expo-crypto";
import { Platform } from "react-native";

/** uuid and other web APIs expect global crypto on native runtimes. */
if (
  Platform.OS !== "web" &&
  typeof globalThis.crypto?.getRandomValues !== "function"
) {
  globalThis.crypto = {
    getRandomValues: (typedArray) =>
      ExpoCrypto.getRandomValues(typedArray as unknown as Uint8Array),
    randomUUID: () => ExpoCrypto.randomUUID(),
  } as Crypto;
}
