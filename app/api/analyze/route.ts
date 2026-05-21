import { NextRequest, NextResponse } from "next/server"
import { PrivacyFormData, AnalysisResult, AIRecommendation } from "@/lib/types"
import { calculatePrivacyScore } from "@/lib/score-engine"
import { generateAIRecommendations } from "@/lib/ai-service"
import prisma from "@/lib/db"
import { requireCurrentUser } from "@/lib/authorization"
import { databaseUnavailableResponse, isDatabaseUnavailableError } from "@/lib/api-errors"
import { analyzeWithMl } from "@/lib/ml/predictor"
import { logger } from "@/lib/logger"

function toLegacyRiskLevel(riskLevel: "Low" | "Medium" | "High") {
  return riskLevel.toLowerCase() as "low" | "medium" | "high"
}

function toMlRiskLevel(score: number): "Low" | "Medium" | "High" {
  if (score >= 70) return "High"
  if (score >= 31) return "Medium"
  return "Low"
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  try {
    const auth = await requireCurrentUser()
    if (!auth.ok) {
      logger.warn("analyze.auth.rejected")
      return auth.response
    }
    const user = auth.user

    const body = await request.json()
    const data = body as PrivacyFormData

    logger.info("analyze.request.received", {
      userId: user.id,
      onlineAccounts: data.onlineAccounts,
      connectedApps: data.connectedApps,
    })

    const baselineScore = calculatePrivacyScore(data)
    const mlResult = await analyzeWithMl(data)
    const rawModelScore = mlResult.prediction.privacy_score
    const calibratedScore = Math.max(rawModelScore, baselineScore.totalScore)
    const calibratedRiskLevel = toMlRiskLevel(calibratedScore)
    logger.info("ml.prediction.completed", {
      userId: user.id,
      model: mlResult.prediction.model,
      source: mlResult.prediction.prediction_metadata.source,
      rawScore: rawModelScore,
      baselineScore: baselineScore.totalScore,
      calibratedScore,
      latencyMs: mlResult.prediction.prediction_metadata.latency_ms,
      domainCount: mlResult.domain_analysis.length,
    })
    logger.info("domain.analysis.completed", {
      userId: user.id,
      domains: mlResult.domain_analysis.map((domain) => `${domain.domain}:${domain.risk_score}`).join(","),
      highRiskDomains: mlResult.domain_analysis
        .filter((domain) => domain.risk_level === "High" || domain.risk_level === "Critical")
        .map((domain) => domain.domain)
        .join(",") || "none",
    })

    const score = {
      ...baselineScore,
      totalScore: calibratedScore,
      riskLevel: toLegacyRiskLevel(calibratedRiskLevel),
      ml: {
        privacyScore: calibratedScore,
        riskLevel: calibratedRiskLevel,
        topRiskFactors: mlResult.prediction.top_risk_factors,
        protectiveFactors: mlResult.prediction.protective_factors,
        featureContributions: mlResult.prediction.feature_contributions,
        shapSummary: mlResult.prediction.shap_summary,
        model: mlResult.prediction.model,
        modelVersion: mlResult.prediction.model_version,
        predictionMetadata: mlResult.prediction.prediction_metadata,
        domainAnalysis: mlResult.domain_analysis.map((domain) => ({
          domain: domain.domain,
          risk_score: domain.risk_score,
          risk_level: domain.risk_level,
          red_flags: domain.red_flags,
          privacy_debt_impact: domain.privacy_debt_impact,
        })),
        rawModelScore,
        calibratedScore,
      },
    }

    // Generate AI recommendations
    let recommendations: AIRecommendation

    try {
      logger.info("genai.recommendations.requested", {
        userId: user.id,
        score: score.totalScore,
        model: score.ml.model,
      })
      recommendations = await generateAIRecommendations(data, score)
      logger.info("genai.recommendations.completed", {
        userId: user.id,
        recommendations: recommendations.recommendations.length,
      })
    } catch (aiError) {
      // Fallback to rule-based recommendations if AI fails
      logger.warn("genai.recommendations.fallback", {
        userId: user.id,
        reason: aiError instanceof Error ? aiError.message : "unknown",
      })
      recommendations = generateFallbackRecommendations(data, score)
    }

    // Save to PostgreSQL database
    let savedAnalysisId: string | undefined = undefined

    try {
      const savedAnalysis = await prisma.analysis.create({
        data: {
          userId: user.id,
          score: score as any,
          recommendations: recommendations as any,
          formData: data as any,
        },
      })
      savedAnalysisId = savedAnalysis.id
      logger.info("database.analysis.saved", {
        userId: user.id,
        analysisId: savedAnalysis.id,
        score: score.totalScore,
      })
    } catch (dbError) {
      logger.error("database.analysis.save_failed", dbError, { userId: user.id })
      if (isDatabaseUnavailableError(dbError)) {
        return databaseUnavailableResponse()
      }

      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 })
    }

    const result: AnalysisResult = {
      id: savedAnalysisId,
      score,
      recommendations,
    }

    logger.info("analyze.response.completed", {
      userId: user.id,
      analysisId: savedAnalysisId,
      durationMs: Date.now() - startedAt,
    })
    return NextResponse.json(result)
  } catch (error) {
    logger.error("analyze.response.failed", error, { durationMs: Date.now() - startedAt })
    return NextResponse.json(
      { error: "Failed to analyze privacy data" },
      { status: 500 }
    )
  }
}


function generateFallbackRecommendations(
  data: PrivacyFormData,
  score: { totalScore: number; breakdown: { accountsRisk: number; passwordRisk: number; thirdPartyRisk: number; visibilityRisk: number; securityRisk: number; dataSharingRisk: number } }
): AIRecommendation {
  const topRisks: string[] = []
  const recommendations: string[] = []
  const priorityImprovements: string[] = []

  // Analyze password risks
  if (data.passwordReuse !== "never") {
    topRisks.push("Password reuse detected across multiple accounts")
    recommendations.push("Use a password manager to generate and store unique passwords for each account")
    priorityImprovements.push("Stop reusing passwords immediately")
  }

  if (data.passwordStrength === "weak" || data.passwordStrength === "medium") {
    topRisks.push("Weak password strength increases vulnerability to brute-force attacks")
    recommendations.push("Create strong passwords with at least 12 characters, mixing letters, numbers, and symbols")
  }

  // Analyze 2FA
  if (data.twoFactorAuth === "none" || data.twoFactorAuth === "some") {
    topRisks.push("Insufficient two-factor authentication coverage")
    recommendations.push("Enable two-factor authentication on all accounts, especially financial and email accounts")
    priorityImprovements.push("Enable 2FA on your most important accounts")
  }

  // Analyze third-party apps
  if (data.connectedApps > 10) {
    topRisks.push(`${data.connectedApps} third-party apps have access to your accounts`)
    recommendations.push("Review and revoke access for apps you no longer use")
  }

  // Analyze visibility settings
  if (data.profileVisibility === "public") {
    topRisks.push("Public profile visibility exposes personal information to anyone")
    recommendations.push("Set your social media profiles to private or friends-only")
    priorityImprovements.push("Change profile visibility to private")
  }

  // Analyze data sharing
  const sensitiveData = data.sharedDataTypes.filter((t) =>
    ["Government ID", "Payment Information", "Home Address"].includes(t)
  )
  if (sensitiveData.length > 0) {
    topRisks.push(`Sensitive data types shared online: ${sensitiveData.join(", ")}`)
    recommendations.push("Be cautious about sharing sensitive information online")
  }

  // Analyze inactive accounts
  if (data.inactiveAccounts > 5) {
    topRisks.push(`${data.inactiveAccounts} inactive accounts may be vulnerable to compromise`)
    recommendations.push("Delete or secure inactive accounts that you no longer use")
  }

  // Analyze tracking permissions
  if (data.adTracking === "enabled") {
    recommendations.push("Disable ad tracking in your device and browser settings")
  }

  if (data.cookieConsent === "accept") {
    recommendations.push("Be more selective about accepting cookies - choose 'necessary only' when possible")
  }

  // Analyze browsing habits
  if (data.unknownSiteFrequency === "frequent") {
    topRisks.push("Frequent visits to unknown websites increase exposure to phishing and malware")
    recommendations.push("Use a reputable browser extension to check website safety before visiting")
  }

  if (data.unknownDownloads === "often") {
    topRisks.push("Downloading from unknown sources poses significant security risks")
    recommendations.push("Only download files from trusted sources and scan all downloads with antivirus software")
    priorityImprovements.push("Stop downloading from unknown sources")
  }

  // Ensure we have at least some recommendations
  if (recommendations.length === 0) {
    recommendations.push("Continue maintaining good privacy practices")
    recommendations.push("Regularly review app permissions and connected services")
    recommendations.push("Stay informed about data breaches that may affect your accounts")
  }

  if (topRisks.length === 0) {
    topRisks.push("Your privacy practices are generally good")
  }

  if (priorityImprovements.length === 0) {
    priorityImprovements.push("Conduct a quarterly review of your privacy settings")
  }

  return {
    topRisks: topRisks.slice(0, 5),
    recommendations: recommendations.slice(0, 6),
    priorityImprovements: priorityImprovements.slice(0, 3),
  }
}
