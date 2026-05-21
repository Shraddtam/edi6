import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireCurrentUser } from "@/lib/authorization"
import { logger } from "@/lib/logger"

export async function GET() {
  try {
    const auth = await requireCurrentUser()
    if (!auth.ok) {
      return auth.response
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: {
        analyses: {
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!user) {
      logger.warn("database.analysis.history_user_missing", { userId: auth.user.id })
      return NextResponse.json([])
    }

    // Map analyses to a clean format for history list
    const history = user.analyses.map((analysis) => ({
      id: analysis.id,
      createdAt: analysis.createdAt,
      score: (analysis.score as any).totalScore,
      riskLevel: (analysis.score as any).riskLevel,
    }))

    logger.info("database.analysis.history_completed", {
      userId: auth.user.id,
      count: history.length,
    })
    return NextResponse.json(history)
  } catch (error) {
    console.error("Fetch analysis history error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analysis history" },
      { status: 500 }
    )
  }
}
