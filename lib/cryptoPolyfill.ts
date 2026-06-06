import * as ExpoCrypto from "expo-crypto";
import { Platform } from "react-native";

function bufferSourceToBinaryString(data: BufferSource): string {
  const bytes =
    data instanceof ArrayBuffer
      ? new Uint8Array(data)
      : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

/** uuid, Supabase PKCE, and other web APIs expect global crypto on native runtimes. */
if (Platform.OS !== "web") {
  const existing = globalThis.crypto;
  const subtle = existing?.subtle ?? ({} as SubtleCrypto);

  if (typeof subtle.digest !== "function") {
    subtle.digest = async (
      algorithm: AlgorithmIdentifier,
      data: BufferSource,
    ): Promise<ArrayBuffer> => {
      const name =
        typeof algorithm === "string" ? algorithm : algorithm.name;
      if (name !== "SHA-256") {
        throw new Error(`Unsupported digest algorithm: ${name}`);
      }

      const hex = await ExpoCrypto.digestStringAsync(
        ExpoCrypto.CryptoDigestAlgorithm.SHA256,
        bufferSourceToBinaryString(data),
        { encoding: ExpoCrypto.CryptoEncoding.HEX },
      );
      return hexToArrayBuffer(hex);
    };
  }

  globalThis.crypto = {
    ...existing,
    getRandomValues:
      existing?.getRandomValues ??
      ((typedArray) =>
        ExpoCrypto.getRandomValues(typedArray as unknown as Uint8Array)),
    randomUUID: existing?.randomUUID ?? (() => ExpoCrypto.randomUUID()),
    subtle: {
      ...subtle,
      digest: subtle.digest.bind(subtle),
    },
  } as Crypto;
}
