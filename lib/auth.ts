import "server-only"

import { cookies } from "next/headers"
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "crypto"
import { promisify } from "util"
import prisma from "@/lib/db"

const scrypt = promisify(scryptCallback)
const SESSION_COOKIE_NAME = "privacy_debt_session"
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7

type SessionPayload = {
  userId: string
  email: string
  exp: number
}

export type AuthUser = {
  id: string
  name: string
  email: string
}

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET

  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET is required in production")
  }

  return secret || "development-auth-secret-change-me"
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url")
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8")
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url")
}

function createSessionToken(payload: SessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))
  return `${encodedPayload}.${sign(encodedPayload)}`
}

function readSessionToken(token?: string): SessionPayload | null {
  if (!token) {
    return null
  }

  const [encodedPayload, signature] = token.split(".")
  if (!encodedPayload || !signature) {
    return null
  }

  const expectedSignature = sign(encodedPayload)
  const signatureBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload
    if (!payload.userId || !payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("base64url")
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  return `${salt}:${derivedKey.toString("base64url")}`
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [salt, key] = passwordHash.split(":")
  if (!salt || !key) {
    return false
  }

  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  const storedKey = Buffer.from(key, "base64url")

  return derivedKey.length === storedKey.length && timingSafeEqual(derivedKey, storedKey)
}

export async function setAuthCookie(user: AuthUser) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  const token = createSessionToken({
    userId: user.id,
    email: user.email,
    exp: expiresAt,
  })

  ;(await cookies()).set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  })
}

export async function clearAuthCookie() {
  ;(await cookies()).delete(SESSION_COOKIE_NAME)
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  const session = readSessionToken(token)

  if (!session) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true },
  })

  return user
}
