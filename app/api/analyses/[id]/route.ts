import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { requireCurrentUser } from "@/lib/authorization"
import { logger } from "@/lib/logger"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireCurrentUser()
    if (!auth.ok) {
      return auth.response
    }
    const user = auth.user

    const { id } = await params
    logger.info("database.analysis.fetch_requested", {
      userId: user.id,
      analysisId: id,
    })
    
    const analysis = await prisma.analysis.findFirst({
      where: { id, userId: user.id },
    })

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 }
      )
    }
    logger.info("database.analysis.fetch_completed", {
      userId: user.id,
      analysisId: analysis.id,
    })

    // Map database record to AnalysisResult structure
    const result = {
      id: analysis.id,
      score: analysis.score,
      recommendations: analysis.recommendations,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Fetch analysis error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 }
    )
  }
}
