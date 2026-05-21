import { NextResponse } from "next/server"
import { clearAuthCookie } from "@/lib/auth"
import { logger } from "@/lib/logger"

export async function POST() {
  await clearAuthCookie()
  logger.info("auth.logout.completed")
  return NextResponse.json({ ok: true })
}
