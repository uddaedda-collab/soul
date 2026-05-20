import * as Crypto from 'expo-crypto';
import nacl from 'tweetnacl';
import { decodeUTF8, encodeBase64, decodeBase64, encodeUTF8 } from 'tweetnacl-util';

export async function roomKeyFromSecret(roomId: string, inviteToken: string) {
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${roomId}:${inviteToken}:soulsync-room-chat-v1`
  );
  return decodeHex(digest).slice(0, nacl.secretbox.keyLength);
}

export function encryptText(text: string, key: Uint8Array) {
  const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
  const box = nacl.secretbox(decodeUTF8(text), nonce, key);
  return {
    encryptedBody: encodeBase64(box),
    nonce: encodeBase64(nonce)
  };
}

export function decryptText(encryptedBody: string, nonce: string, key: Uint8Array) {
  const opened = nacl.secretbox.open(decodeBase64(encryptedBody), decodeBase64(nonce), key);
  if (!opened) {
    return '';
  }
  return encodeUTF8(opened);
}

function decodeHex(hex: string) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
