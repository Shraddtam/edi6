import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import prisma from "@/lib/db"
import { setAuthCookie, verifyPassword } from "@/lib/auth"
import { databaseUnavailableResponse, isDatabaseUnavailableError } from "@/lib/api-errors"
import { logger } from "@/lib/logger"

const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

export async function POST(request: NextRequest) {
  try {
    const input = loginSchema.parse(await request.json())
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    })

    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      logger.warn("auth.login.rejected", { email: input.email })
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const authUser = { id: user.id, name: user.name, email: user.email }
    await setAuthCookie(authUser)
    logger.info("auth.login.completed", {
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json({ user: authUser })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid login data" }, { status: 400 })
    }

    if (isDatabaseUnavailableError(error)) {
      return databaseUnavailableResponse()
    }

    logger.error("auth.login.failed", error)
    return NextResponse.json({ error: "Failed to sign in" }, { status: 500 })
  }
}
