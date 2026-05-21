import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import prisma from "@/lib/db"
import { hashPassword, setAuthCookie } from "@/lib/auth"
import { databaseUnavailableResponse, isDatabaseUnavailableError } from "@/lib/api-errors"
import { logger } from "@/lib/logger"

const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const input = signupSchema.parse(await request.json())
    const passwordHash = await hashPassword(input.password)

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
      },
      select: { id: true, name: true, email: true },
    })

    await setAuthCookie(user)
    logger.info("auth.signup.completed", {
      userId: user.id,
      email: user.email,
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message || "Invalid signup data" }, { status: 400 })
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      logger.warn("auth.signup.duplicate_email")
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 })
    }

    if (isDatabaseUnavailableError(error)) {
      return databaseUnavailableResponse()
    }

    logger.error("auth.signup.failed", error)
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 })
  }
}
