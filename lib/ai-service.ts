import { generateText, Output } from "ai"
import { z } from "zod"
import { PrivacyFormData, PrivacyScore, AIRecommendation } from "./types"
import { logger } from "@/lib/logger"

const recommendationSchema = z.object({
  topRisks: z.array(z.string()).describe("Top 3-5 privacy risks identified"),
  recommendations: z.array(z.string()).describe("5-6 actionable recommendations"),
  priorityImprovements: z.array(z.string()).describe("Top 3 most urgent improvements"),
})

export async function generateAIRecommendations(
  data: PrivacyFormData,
  score: PrivacyScore
): Promise<AIRecommendation> {
  const prompt = buildPrompt(data, score)
  const apiKey = process.env.GROQ_API_KEY || process.env.AI_GATEWAY_API_KEY

  if (apiKey?.startsWith("gsk_")) {
    return generateGroqRecommendations(apiKey, prompt)
  }

  const { output } = await generateText({
    model: "openai/gpt-5-mini",
    output: Output.object({
      schema: recommendationSchema,
    }),
    messages: [
      {
        role: "system",
        content: `You are a cybersecurity and digital privacy expert. Analyze user privacy behaviors and provide actionable 
        recommendations to reduce their privacy risk exposure. Be specific and practical in your recommendations.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  if (!output) {
    throw new Error("Failed to generate AI recommendations")
  }

  return output
}

async function generateGroqRecommendations(apiKey: string, prompt: string): Promise<AIRecommendation> {
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"

  logger.info("genai.groq.request.started", { model })

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a cybersecurity and digital privacy expert. Return only valid JSON matching this shape: {\"topRisks\": string[], \"recommendations\": string[], \"priorityImprovements\": string[]}. Do not predict scores; explain the provided ML and risk outputs.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.error?.message || `Groq request failed with ${response.status}`)
  }

  const content = payload?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error("Groq response did not include message content")
  }

  const parsed = recommendationSchema.parse(JSON.parse(content))
  logger.info("genai.groq.request.completed", {
    model,
    recommendations: parsed.recommendations.length,
  })

  return parsed
}

function buildPrompt(data: PrivacyFormData, score: PrivacyScore): string {
  return `Analyze the following user's digital privacy behavior and provide recommendations to reduce their privacy risk.

## Privacy Debt Score: ${score.totalScore}/100 (${score.riskLevel.toUpperCase()} RISK)

## Risk Breakdown:
- Account Exposure Risk: ${score.breakdown.accountsRisk}/100
- Password Security Risk: ${score.breakdown.passwordRisk}/100  
- Third-Party Apps Risk: ${score.breakdown.thirdPartyRisk}/100
- Visibility Settings Risk: ${score.breakdown.visibilityRisk}/100
- Security Practices Risk: ${score.breakdown.securityRisk}/100
- Data Sharing Risk: ${score.breakdown.dataSharingRisk}/100

## User Behavior Data:

### Account Information:
- Total online accounts: ${data.onlineAccounts}
- Inactive accounts: ${data.inactiveAccounts}
- Platform categories used: ${data.platformCategories.join(", ") || "None specified"}
- Specific apps: ${data.specificApps.join(", ") || "None specified"}

### Authentication & Security:
- Password reuse: ${data.passwordReuse}
- Password strength: ${data.passwordStrength}
- Two-factor authentication: ${data.twoFactorAuth}
- Login methods: ${data.loginMethods.join(", ") || "None specified"}

### Data Sharing:
- Data types shared: ${data.sharedDataTypes.join(", ") || "None"}
- Sharing frequency: ${data.sharingFrequency}

### Third-Party Apps:
- Connected apps: ${data.connectedApps}
- Named apps: ${data.thirdPartyAppNames.join(", ") || "None specified"}

### Privacy Settings:
- Profile visibility: ${data.profileVisibility}
- Location sharing: ${data.locationSharing}
- Ad tracking: ${data.adTracking}
- Cookie consent: ${data.cookieConsent}

### Website Interaction:
- Unknown site visits: ${data.unknownSiteFrequency}
- Unknown downloads: ${data.unknownDownloads}
- Frequently visited sites: ${data.frequentSites || "Not specified"}

### Additional Notes from User:
${data.additionalNotes || "None provided"}

## ML Model Output:
${
  score.ml
    ? `- Model: ${score.ml.model} (${score.ml.predictionMetadata.source})
- Model version: ${score.ml.modelVersion}
- ML privacy score: ${score.ml.privacyScore}/100 (${score.ml.riskLevel})
- Top ML risk factors: ${score.ml.topRiskFactors.join(", ") || "None"}
- Protective factors: ${score.ml.protectiveFactors.join(", ") || "None"}
- Domain risks: ${
        score.ml.domainAnalysis.length > 0
          ? score.ml.domainAnalysis
              .map((domain) => `${domain.domain}: ${domain.risk_score}/100 ${domain.risk_level}`)
              .join("; ")
          : "No domains detected"
      }`
    : "ML output unavailable; use the rule-based score context above."
}

Based on this information, provide:
1. Top 3-5 privacy risks this user faces
2. 5-6 specific, actionable recommendations to improve their privacy
3. Top 3 most urgent/priority improvements they should make immediately`
}
