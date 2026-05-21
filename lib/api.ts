import { PrivacyFormData, AnalysisResult } from "./types"

export async function analyzePrivacy(data: PrivacyFormData): Promise<AnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error || "Failed to analyze privacy data")
  }

  return response.json()
}
