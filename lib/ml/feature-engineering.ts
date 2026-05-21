import "server-only"

import type { PrivacyFormData } from "@/lib/types"

export type PrivacyFeatureVector = Record<string, number>

const passwordReuseRisk: Record<PrivacyFormData["passwordReuse"], number> = {
  never: 0,
  sometimes: 2,
  often: 5,
  always: 8,
}

const passwordStrengthScore: Record<PrivacyFormData["passwordStrength"], number> = {
  weak: 25,
  medium: 55,
  strong: 80,
  manager: 95,
}

const twoFactorScore: Record<PrivacyFormData["twoFactorAuth"], number> = {
  none: 0,
  some: 40,
  most: 75,
  all: 100,
}

const profileVisibilityRisk: Record<PrivacyFormData["profileVisibility"], number> = {
  private: 10,
  friends: 45,
  public: 85,
}

const sharingFrequencyRisk: Record<PrivacyFormData["sharingFrequency"], number> = {
  rarely: 10,
  occasionally: 35,
  often: 65,
  "very-often": 90,
}

const cookieRisk: Record<PrivacyFormData["cookieConsent"], number> = {
  reject: 10,
  sometimes: 45,
  accept: 80,
}

const unknownSiteRisk: Record<PrivacyFormData["unknownSiteFrequency"], number> = {
  rare: 10,
  occasional: 45,
  frequent: 85,
}

const appDomainMap: Record<string, string> = {
  instagram: "instagram.com",
  facebook: "facebook.com",
  whatsapp: "whatsapp.com",
  google: "google.com",
  gmail: "gmail.com",
  amazon: "amazon.com",
  linkedin: "linkedin.com",
  netflix: "netflix.com",
  spotify: "spotify.com",
  dropbox: "dropbox.com",
  notion: "notion.so",
  canva: "canva.com",
  slack: "slack.com",
  trello: "trello.com",
  zapier: "zapier.com",
  ifttt: "ifttt.com",
}

const categoryDomainMap: Record<string, string[]> = {
  "Social Media": ["x.com", "instagram.com", "linkedin.com"],
  "Email Services": ["gmail.com", "outlook.com"],
  "Financial Apps": ["paypal.com"],
  "Shopping Platforms": ["amazon.com", "flipkart.com"],
  "Cloud Storage": ["drive.google.com", "dropbox.com"],
  "Messaging Apps": ["whatsapp.com", "telegram.org"],
  "Gaming Platforms": ["steampowered.com"],
  "Government Services": ["uidai.gov.in"],
}

function boolScore(value: boolean) {
  return value ? 1 : 0
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}

export function extractDomainsFromFormData(data: PrivacyFormData) {
  const rawValues = [
    data.frequentSites,
    ...data.specificApps,
    ...data.thirdPartyAppNames,
  ]

  const explicitDomains = rawValues
    .flatMap((value) => value.split(/[\s,;]+/))
    .map((value) => value.trim().toLowerCase())
    .map((value) => value.replace(/^https?:\/\//, "").split("/")[0])
    .filter((value) => value.includes(".") && value.length > 3)

  const mappedAppDomains = [...data.specificApps, ...data.thirdPartyAppNames]
    .map((value) => value.trim().toLowerCase())
    .map((value) => appDomainMap[value])
    .filter(Boolean)

  const categoryDomains = data.platformCategories.flatMap((category) => categoryDomainMap[category] || [])
  const domains = [...explicitDomains, ...mappedAppDomains, ...categoryDomains]

  return Array.from(new Set(domains)).slice(0, 25)
}

export function buildPrivacyFeatureVector(data: PrivacyFormData): PrivacyFeatureVector {
  const riskyDomainsVisited =
    unknownSiteRisk[data.unknownSiteFrequency] / 10 +
    (data.unknownDownloads === "often" ? 4 : data.unknownDownloads === "sometimes" ? 2 : 0)

  const protectionScore = clamp(
    twoFactorScore[data.twoFactorAuth] * 0.45 +
      passwordStrengthScore[data.passwordStrength] * 0.35 +
      (data.adTracking === "disabled" ? 20 : data.adTracking === "limited" ? 10 : 0)
  )

  const exposureIndex = clamp(
    data.onlineAccounts * 1.2 +
      data.inactiveAccounts * 2.5 +
      data.connectedApps * 1.8 +
      data.sharedDataTypes.length * 4 +
      profileVisibilityRisk[data.profileVisibility] * 0.35
  )

  const riskBurden = clamp(
    exposureIndex * 0.45 +
      passwordReuseRisk[data.passwordReuse] * 6 +
      sharingFrequencyRisk[data.sharingFrequency] * 0.25 +
      cookieRisk[data.cookieConsent] * 0.15
  )

  const privacyAwareness =
    data.additionalNotes.length > 80 || data.twoFactorAuth === "all"
      ? 2
      : data.twoFactorAuth === "most" || data.passwordStrength === "manager"
        ? 1
        : 0

  return {
    privacy_awareness: privacyAwareness,
    password_reuse_count: passwordReuseRisk[data.passwordReuse],
    risky_domains_visited: riskyDomainsVisited,
    third_party_apps: data.connectedApps,
    inactive_accounts: data.inactiveAccounts,
    breached_accounts: 0,
    tracker_acceptance_rate: cookieRisk[data.cookieConsent] / 100,
    avg_password_strength: passwordStrengthScore[data.passwordStrength],
    public_profile_score: profileVisibilityRisk[data.profileVisibility],
    pii_shared_frequency: sharingFrequencyRisk[data.sharingFrequency],
    vpn_usage: boolScore(data.loginMethods.some((method) => method.toLowerCase().includes("vpn"))),
    mfa_enabled: twoFactorScore[data.twoFactorAuth] / 100,
    browser_security_score: clamp(100 - unknownSiteRisk[data.unknownSiteFrequency]),
    account_age_days: 365,
    risk_burden: riskBurden,
    protection_score: protectionScore,
    exposure_index: exposureIndex,
    awareness_adjusted_risk: clamp(riskBurden - privacyAwareness * 8),
  }
}
