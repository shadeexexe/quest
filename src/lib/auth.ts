import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "ExperementariumAdmin";
// Резервный bcrypt-хеш пароля (в base64). Открытый пароль в коде не хранится.
// Переопределяется переменной окружения ADMIN_PASSWORD_HASH_B64.
const DEFAULT_PASSWORD_HASH_B64 =
  "JDJiJDEwJEVsYWZLLnJaR01hQ2xnRjcvZ0prNmUyaXFyQkhKemtPOHpSZThIN1doazM5RmJmcXNxRFBP";
const ADMIN_PASSWORD_HASH_B64 = process.env.ADMIN_PASSWORD_HASH_B64 || DEFAULT_PASSWORD_HASH_B64;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";
const ADMIN_PASSWORD_FALLBACK = process.env.ADMIN_PASSWORD || "";

/** Достаёт bcrypt-хеш из base64-переменной или из обычной переменной с хешем. */
function resolvePasswordHash(): string {
  if (ADMIN_PASSWORD_HASH_B64) {
    try {
      const decoded = Buffer.from(ADMIN_PASSWORD_HASH_B64, "base64").toString("utf8").trim();
      if (decoded.startsWith("$2")) return decoded;
    } catch {
      // игнорируем некорректную base64-строку
    }
  }
  if (ADMIN_PASSWORD_HASH.startsWith("$2")) return ADMIN_PASSWORD_HASH;
  return "";
}
const SESSION_SECRET = process.env.SESSION_SECRET || "hp_quest_anapa_session_secret";
const SESSION_COOKIE = "hp_quest_admin";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 часов

function sign(payload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function verifyAdminCredentials(username: string, password: string): Promise<boolean> {
  const normalizedUser = (username || "").trim();
  const normalizedPass = password || "";

  if (!normalizedUser || !normalizedPass) return false;
  if (normalizedUser !== ADMIN_USERNAME) return false;

  const passwordHash = resolvePasswordHash();
  if (passwordHash) {
    try {
      return await bcrypt.compare(normalizedPass, passwordHash);
    } catch {
      return false;
    }
  }

  // Резервный вариант: пароль задан открыто в переменной окружения хостинга.
  if (ADMIN_PASSWORD_FALLBACK) {
    return safeEqual(normalizedPass, ADMIN_PASSWORD_FALLBACK);
  }

  return false;
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${ADMIN_USERNAME}.${expiresAt}`;
  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;

  const [encoded, signature] = parts;
  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return false;
  }

  if (!safeEqual(signature, sign(payload))) return false;

  const [username, expiresAtRaw] = payload.split(".");
  if (username !== ADMIN_USERNAME) return false;

  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  return true;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const store = await cookies();
  if (verifySessionToken(store.get(SESSION_COOKIE)?.value)) return true;

  // Запасной вариант: токен в заголовке Authorization (если браузер блокирует cookie во фрейме).
  const headerStore = await headers();
  const auth = headerStore.get("authorization") || "";
  if (auth.toLowerCase().startsWith("bearer ")) {
    return verifySessionToken(auth.slice(7).trim());
  }
  return false;
}

async function isHttpsRequest(): Promise<boolean> {
  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim() === "https";
  return process.env.NODE_ENV === "production";
}

/** Создаёт сессию и возвращает токен (для заголовка Authorization). */
export async function setAdminSession(): Promise<string> {
  const store = await cookies();
  const token = createSessionToken();
  const https = await isHttpsRequest();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: https,
    sameSite: https ? "none" : "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
  return token;
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function adminUsername(): string {
  return ADMIN_USERNAME;
}
