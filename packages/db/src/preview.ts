/**
 * Signed draft-preview tokens shared by admin (signs) and sites (verifies).
 * Uses Web Crypto so it runs in Node, Edge and the Next.js proxy.
 */
const enc = new TextEncoder();

function b64url(buf: ArrayBuffer) {
  return Buffer.from(new Uint8Array(buf)).toString("base64url");
}

async function key(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

export async function signPreviewToken(siteId: string, ttlSeconds = 60 * 60 * 24, secret = process.env.PREVIEW_SECRET) {
  if (!secret) throw new Error("PREVIEW_SECRET is not set");
  const exp = Math.floor(Date.now() / 1000) + ttlSeconds;
  const payload = `${siteId}.${exp}`;
  const sig = await crypto.subtle.sign("HMAC", await key(secret), enc.encode(payload));
  return `${payload}.${b64url(sig)}`;
}

export async function verifyPreviewToken(token: string | null | undefined, siteId: string, secret = process.env.PREVIEW_SECRET) {
  if (!token || !secret) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [sid, expStr, sig] = parts;
  if (sid !== siteId || Number(expStr) < Date.now() / 1000) return false;
  const expected = b64url(await crypto.subtle.sign("HMAC", await key(secret), enc.encode(`${sid}.${expStr}`)));
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  return diff === 0;
}
