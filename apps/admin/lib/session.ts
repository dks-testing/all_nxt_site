import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "admin_session";
const secret = () => {
  const s = process.env.SESSION_SECRET || process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET (or AUTH_SECRET) must be at least 32 characters");
  return new TextEncoder().encode(s);
};

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret());
}

export async function verifySessionToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

