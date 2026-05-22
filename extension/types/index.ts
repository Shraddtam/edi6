export type RiskLevel = "Low" | "Medium" | "High" | "Critical"

export type LocalDomainFeatures = {
  domain: string
  tld: string
  urlLength: number
  hyphenCount: number
  digitRatio: number
  entropy: number
  subdomainDepth: number
  suspiciousKeyword: boolean
  typosquatCandidate: boolean
  closestBrand?: string
  levenshteinDistance?: number
}

export type ContentSignals = {
  url: string
  domain: string
  loginFormDetected: boolean
  piiFieldCount: number
  consentBannerDetected: boolean
  trackerCount: number
  thirdPartyRequestCount: number
}

export type DomainRiskResult = {
  domain: string
  risk_score: number
  risk_level: RiskLevel
  red_flags: string[]
  privacy_debt_impact: number
  features?: Record<string, unknown>
  extension_signals?: Record<string, unknown>
}

export type PrivacyDebtEvent = {
  id: string
  type: "domain_visit" | "tracker_detected" | "login_form" | "download_warning" | "consent_banner"
  domain: string
  url?: string
  riskScore: number
  riskLevel: RiskLevel
  impact: number
  redFlags: string[]
  createdAt: number
}

export type ExtensionState = {
  paused: boolean
  currentDomain?: string
  currentRisk?: DomainRiskResult
  cumulativeScore: number
  trackerCount: number
  recentEvents: PrivacyDebtEvent[]
  lastUpdated?: number
}

export type ExtensionMessage =
  | { type: "CONTENT_SIGNALS"; payload: ContentSignals }
  | { type: "GET_STATE" }
  | { type: "STATE_UPDATED"; payload: ExtensionState }
  | { type: "SET_PAUSED"; payload: boolean }
  | { type: "ANALYZE_ACTIVE_TAB" }
