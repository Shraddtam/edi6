import "server-only"

import type { FeatureContribution } from "@/lib/ml/types"

const featureLabels: Record<string, string> = {
  privacy_awareness: "Privacy awareness",
  password_reuse_count: "Password reuse",
  risky_domains_visited: "Risky domains visited",
  third_party_apps: "Third-party apps",
  inactive_accounts: "Inactive accounts",
  breached_accounts: "Breached accounts",
  tracker_acceptance_rate: "Tracker acceptance",
  avg_password_strength: "Password strength",
  public_profile_score: "Public profile exposure",
  pii_shared_frequency: "PII sharing frequency",
  vpn_usage: "VPN usage",
  mfa_enabled: "Multi-factor authentication",
  browser_security_score: "Browser security",
  account_age_days: "Account age",
  risk_burden: "Risk burden",
  protection_score: "Protection score",
  exposure_index: "Exposure index",
  awareness_adjusted_risk: "Awareness-adjusted risk",
}

const protectiveFeatures = new Set([
  "privacy_awareness",
  "avg_password_strength",
  "vpn_usage",
  "mfa_enabled",
  "browser_security_score",
  "protection_score",
])

export function normalizeFeatureContributions(
  contributions: Record<string, number>,
  values: Record<string, number>
): FeatureContribution[] {
  return Object.entries(contributions)
    .map(([feature, contribution]) => {
      const isProtectiveContribution = contribution < 0 || protectiveFeatures.has(feature)

      return {
        feature,
        value: values[feature] ?? 0,
        contribution,
        direction: isProtectiveContribution ? "protective" : "risk",
        label: featureLabels[feature] || feature.replaceAll("_", " "),
      } satisfies FeatureContribution
    })
    .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
}

export function buildApproximateContributions(features: Record<string, number>) {
  const weights: Record<string, number> = {
    password_reuse_count: 1.4,
    risky_domains_visited: 1.2,
    third_party_apps: 0.7,
    inactive_accounts: 0.9,
    tracker_acceptance_rate: 12,
    public_profile_score: 0.18,
    pii_shared_frequency: 0.16,
    risk_burden: 0.28,
    exposure_index: 0.22,
    awareness_adjusted_risk: 0.2,
    avg_password_strength: -0.12,
    mfa_enabled: -12,
    browser_security_score: -0.1,
    protection_score: -0.18,
    privacy_awareness: -3,
  }

  return Object.fromEntries(
    Object.entries(features).map(([feature, value]) => [
      feature,
      Number(((weights[feature] || 0.04) * value).toFixed(3)),
    ])
  )
}
