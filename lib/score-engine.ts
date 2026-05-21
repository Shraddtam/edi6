import { PrivacyFormData, PrivacyScore } from "./types"

// Weighted factors for scoring (total = 100%)
const WEIGHTS = {
  accounts: 0.20,     // 20%
  password: 0.25,     // 25%
  thirdParty: 0.20,   // 20%
  visibility: 0.15,   // 15%
  security: 0.10,     // 10%
  dataSharing: 0.10,  // 10%
}

export function calculatePrivacyScore(data: PrivacyFormData): PrivacyScore {
  // Calculate individual risk scores (0-100)
  const accountsRisk = calculateAccountsRisk(data)
  const passwordRisk = calculatePasswordRisk(data)
  const thirdPartyRisk = calculateThirdPartyRisk(data)
  const visibilityRisk = calculateVisibilityRisk(data)
  const securityRisk = calculateSecurityRisk(data)
  const dataSharingRisk = calculateDataSharingRisk(data)

  // Calculate weighted total score
  const totalScore = Math.round(
    accountsRisk * WEIGHTS.accounts +
    passwordRisk * WEIGHTS.password +
    thirdPartyRisk * WEIGHTS.thirdParty +
    visibilityRisk * WEIGHTS.visibility +
    securityRisk * WEIGHTS.security +
    dataSharingRisk * WEIGHTS.dataSharing
  )

  // Clamp between 0-100
  const clampedScore = Math.max(0, Math.min(100, totalScore))

  // Determine risk level
  const riskLevel: "low" | "medium" | "high" = 
    clampedScore <= 30 ? "low" :
    clampedScore <= 70 ? "medium" : "high"

  // Calculate platform distribution
  const platformDistribution = calculatePlatformDistribution(data)

  // Calculate data exposure
  const dataExposure = calculateDataExposure(data)

  return {
    totalScore: clampedScore,
    riskLevel,
    breakdown: {
      accountsRisk,
      passwordRisk,
      thirdPartyRisk,
      visibilityRisk,
      securityRisk,
      dataSharingRisk,
    },
    platformDistribution,
    dataExposure,
  }
}

function calculateAccountsRisk(data: PrivacyFormData): number {
  let risk = 0

  // More accounts = more risk (0-50 scale to 0-50 risk)
  risk += Math.min(50, data.onlineAccounts)

  // Inactive accounts increase risk
  const inactiveRatio = data.inactiveAccounts / Math.max(1, data.onlineAccounts)
  risk += inactiveRatio * 30

  // More platform categories = more exposure
  risk += data.platformCategories.length * 2

  return Math.min(100, risk)
}

function calculatePasswordRisk(data: PrivacyFormData): number {
  let risk = 0

  // Password reuse risk
  const reuseRisk: Record<string, number> = {
    never: 0,
    sometimes: 30,
    often: 60,
    always: 100,
  }
  risk += reuseRisk[data.passwordReuse] * 0.5

  // Password strength risk
  const strengthRisk: Record<string, number> = {
    weak: 100,
    medium: 50,
    strong: 20,
    manager: 0,
  }
  risk += strengthRisk[data.passwordStrength] * 0.5

  return Math.min(100, risk)
}

function calculateThirdPartyRisk(data: PrivacyFormData): number {
  let risk = 0

  // Number of connected apps (0-50 scale to 0-70 risk)
  risk += (data.connectedApps / 50) * 70

  // More named apps = potentially more risky apps
  risk += data.thirdPartyAppNames.length * 3

  return Math.min(100, risk)
}

function calculateVisibilityRisk(data: PrivacyFormData): number {
  let risk = 0

  // Profile visibility
  const visibilityRisk: Record<string, number> = {
    private: 0,
    friends: 30,
    public: 70,
  }
  risk += visibilityRisk[data.profileVisibility]

  // Location sharing
  const locationRisk: Record<string, number> = {
    never: 0,
    sometimes: 15,
    always: 30,
  }
  risk += locationRisk[data.locationSharing]

  return Math.min(100, risk)
}

function calculateSecurityRisk(data: PrivacyFormData): number {
  let risk = 0

  // 2FA usage (inverse - more 2FA = less risk)
  const tfaRisk: Record<string, number> = {
    all: 0,
    most: 20,
    some: 50,
    none: 100,
  }
  risk += tfaRisk[data.twoFactorAuth] * 0.4

  // Ad tracking permissions
  const adRisk: Record<string, number> = {
    disabled: 0,
    limited: 30,
    enabled: 60,
  }
  risk += adRisk[data.adTracking] * 0.3

  // Cookie consent behavior
  const cookieRisk: Record<string, number> = {
    reject: 0,
    sometimes: 30,
    accept: 60,
  }
  risk += cookieRisk[data.cookieConsent] * 0.3

  return Math.min(100, risk)
}

function calculateDataSharingRisk(data: PrivacyFormData): number {
  let risk = 0

  // Number of data types shared
  const sensitiveTypes = ["Government ID", "Payment Information", "Home Address"]
  const sharedSensitive = data.sharedDataTypes.filter((t) => sensitiveTypes.includes(t)).length
  const sharedOther = data.sharedDataTypes.length - sharedSensitive

  risk += sharedSensitive * 20
  risk += sharedOther * 8

  // Sharing frequency
  const frequencyRisk: Record<string, number> = {
    rarely: 0,
    occasionally: 15,
    often: 35,
    "very-often": 50,
  }
  risk += frequencyRisk[data.sharingFrequency]

  // Website interaction risks
  const siteRisk: Record<string, number> = {
    rare: 0,
    occasional: 10,
    frequent: 25,
  }
  risk += siteRisk[data.unknownSiteFrequency]

  const downloadRisk: Record<string, number> = {
    never: 0,
    sometimes: 10,
    often: 25,
  }
  risk += downloadRisk[data.unknownDownloads]

  return Math.min(100, risk)
}

function calculatePlatformDistribution(data: PrivacyFormData): { name: string; value: number }[] {
  const categories = data.platformCategories

  return categories.map((category) => ({
    name: category,
    value: Math.max(1, Math.round(data.onlineAccounts / Math.max(1, categories.length))),
  }))
}

function calculateDataExposure(data: PrivacyFormData): { type: string; shared: boolean }[] {
  const allTypes = [
    "Email",
    "Phone Number",
    "Home Address",
    "Payment Information",
    "Government ID",
    "Location Data",
    "Photos/Videos",
    "Contacts",
    "Browsing History",
  ]

  return allTypes.map((type) => ({
    type,
    shared: data.sharedDataTypes.includes(type),
  }))
}
