export interface PrivacyFormData {
  // Section 1: Account Footprint
  onlineAccounts: number
  inactiveAccounts: number
  platformCategories: string[]
  specificApps: string[]

  // Section 2: Authentication & Security
  passwordReuse: "never" | "sometimes" | "often" | "always"
  passwordStrength: "weak" | "medium" | "strong" | "manager"
  twoFactorAuth: "none" | "some" | "most" | "all"
  loginMethods: string[]

  // Section 3: Data Sharing Behavior
  sharedDataTypes: string[]
  sharingFrequency: "rarely" | "occasionally" | "often" | "very-often"

  // Section 4: Third Party Apps
  connectedApps: number
  thirdPartyAppNames: string[]

  // Section 5: Privacy Settings
  profileVisibility: "private" | "friends" | "public"
  locationSharing: "never" | "sometimes" | "always"
  adTracking: "disabled" | "limited" | "enabled"
  cookieConsent: "reject" | "sometimes" | "accept"

  // Section 6: Website Interaction
  unknownSiteFrequency: "rare" | "occasional" | "frequent"
  unknownDownloads: "never" | "sometimes" | "often"
  frequentSites: string

  // Section 7: Additional Notes
  additionalNotes: string
}

export interface PrivacyScore {
  totalScore: number
  riskLevel: "low" | "medium" | "high"
  breakdown: {
    accountsRisk: number
    passwordRisk: number
    thirdPartyRisk: number
    visibilityRisk: number
    securityRisk: number
    dataSharingRisk: number
  }
  platformDistribution: { name: string; value: number }[]
  dataExposure: { type: string; shared: boolean }[]
  ml?: {
    privacyScore: number
    riskLevel: "Low" | "Medium" | "High"
    topRiskFactors: string[]
    protectiveFactors: string[]
    featureContributions: Record<string, number>
    shapSummary: {
      feature: string
      value: number
      contribution: number
      direction: "risk" | "protective"
      label: string
    }[]
    model: string
    modelVersion: string
    predictionMetadata: {
      source: string
      latency_ms: number
      feature_count: number
      fallback_reason?: string
    }
    domainAnalysis: {
      domain: string
      risk_score: number
      risk_level: "Low" | "Medium" | "High" | "Critical"
      red_flags: string[]
      privacy_debt_impact: number
    }[]
    rawModelScore?: number
    calibratedScore?: number
  }
}

export interface AIRecommendation {
  topRisks: string[]
  recommendations: string[]
  priorityImprovements: string[]
}

export interface AnalysisResult {
  id?: string
  score: PrivacyScore
  recommendations: AIRecommendation
}
